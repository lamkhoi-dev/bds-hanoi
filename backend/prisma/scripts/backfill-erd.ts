import { PrismaClient } from '@prisma/client';
import { slugify } from '../../src/property/property-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting ERD Alignment Backfill...');
  
  let locationSlugCount = 0;
  let featuredWardsCount = 0;
  let categoryCount = 0;
  let propertySlugCount = 0;
  let propertyCodeCount = 0;
  let propertyLocationMappedCount = 0;
  let propertyLocationUnmappedCount = 0;
  let pushedAtCount = 0;

  // 1. Location Slug & Featured
  const locations = await prisma.location.findMany();
  for (const loc of locations) {
    let updateData: any = {};
    if (!loc.slug) {
      let finalSlug = slugify(loc.name);
      let counter = 1;
      while (await prisma.location.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slugify(loc.name)}-${counter++}`;
      }
      updateData.slug = finalSlug;
      locationSlugCount++;
    }
    const featuredList = ['Phường Thành Vinh', 'Phường Trường Vinh', 'Phường Vinh Lộc', 'Phường Vinh Phú', 'Phường Vinh Hưng', 'Phường Cửa Lò'];
    if (featuredList.includes(loc.name) && !loc.isFeatured) {
      updateData.isFeatured = true;
      featuredWardsCount++;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.location.update({ where: { id: loc.id }, data: updateData });
    }
  }

  // 2. Categories Hierarchy
  const categories = [
    { name: 'Bán', slug: 'ban', parentName: null, order: 1 },
    { name: 'Cho thuê', slug: 'cho-thue', parentName: null, order: 2 },
    { name: 'Đất nền', slug: 'dat-nen', parentName: 'Bán', order: 1 },
    { name: 'Nhà riêng', slug: 'nha-rieng', parentName: 'Bán', order: 2 },
    { name: 'Chung cư', slug: 'chung-cu', parentName: 'Bán', order: 3 },
    { name: 'Dự án', slug: 'du-an', parentName: 'Bán', order: 4 },
    { name: 'Bất động sản khác', slug: 'bat-dong-san-khac', parentName: 'Bán', order: 5 },
    { name: 'Nhà cho thuê', slug: 'nha-cho-thue', parentName: 'Cho thuê', order: 1 },
    { name: 'Chung cư cho thuê', slug: 'chung-cu-cho-thue', parentName: 'Cho thuê', order: 2 },
    { name: 'Mặt bằng / kho xưởng cho thuê', slug: 'mat-bang-kho-xuong-cho-thue', parentName: 'Cho thuê', order: 3 },
  ];
  for (const c of categories) {
    let parentId: string | null = null;
    if (c.parentName) {
      const parent = await prisma.category.findFirst({ where: { name: c.parentName } });
      if (parent) parentId = parent.id;
    }
    const existing = await prisma.category.findFirst({ where: { slug: c.slug } });
    if (existing) {
      if (existing.parentId !== parentId || existing.sortOrder !== c.order) {
        await prisma.category.update({ where: { id: existing.id }, data: { parentId, sortOrder: c.order } });
        categoryCount++;
      }
    } else {
      await prisma.category.create({ data: { name: c.name, slug: c.slug, parentId, sortOrder: c.order } });
      categoryCount++;
    }
  }

  // 3. Properties (slug, code, mapped locations, pushedAt)
  const properties = await prisma.property.findMany();
  for (const p of properties) {
    let updateData: any = {};
    
    if (!p.slug) {
      let finalSlug = slugify(p.title);
      let counter = 1;
      while (await prisma.property.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slugify(p.title)}-${counter++}`;
      }
      updateData.slug = finalSlug;
      propertySlugCount++;
    }

    if (!p.propertyCode) {
      let isUnique = false;
      let code = '';
      while (!isUnique) {
        code = `BDS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const existing = await prisma.property.findUnique({ where: { propertyCode: code } });
        if (!existing) isUnique = true;
      }
      updateData.propertyCode = code;
      propertyCodeCount++;
    }

    if (!p.pushedAt && p.publishedAt) {
      updateData.pushedAt = p.publishedAt;
      pushedAtCount++;
    }

    // Mapped locations
    if (!p.provinceId && p.city) {
      const cityLoc = await prisma.location.findFirst({ where: { name: p.city, type: 'CITY' } });
      if (cityLoc) updateData.provinceId = cityLoc.id;
    }
    if (!p.districtId && p.district) {
      const distLoc = await prisma.location.findFirst({ where: { name: p.district, type: 'DISTRICT' } });
      if (distLoc) updateData.districtId = distLoc.id;
    }
    if (!p.wardId && p.ward) {
      const wardLoc = await prisma.location.findFirst({ where: { name: p.ward, type: 'WARD' } });
      if (wardLoc) updateData.wardId = wardLoc.id;
    }
    
    if (updateData.provinceId || updateData.districtId || updateData.wardId) {
      propertyLocationMappedCount++;
    } else if (p.city || p.district || p.ward) {
      propertyLocationUnmappedCount++;
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await prisma.property.update({ where: { id: p.id }, data: updateData });
      } catch (e) {
        console.error(`Failed to update property ${p.id}`, e);
      }
    }
  }

  console.log('--- Backfill Report ---');
  console.log(`Location slug created: ${locationSlugCount}`);
  console.log(`Featured wards updated: ${featuredWardsCount}`);
  console.log(`Category hierarchy created/updated: ${categoryCount}`);
  console.log(`Property slug generated: ${propertySlugCount}`);
  console.log(`Property code generated: ${propertyCodeCount}`);
  console.log(`Property FK location mapped: ${propertyLocationMappedCount}`);
  console.log(`Property location unmapped: ${propertyLocationUnmappedCount}`);
  console.log(`pushedAt backfilled: ${pushedAtCount}`);
  console.log('-----------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
