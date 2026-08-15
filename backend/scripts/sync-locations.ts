import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncLocations() {
  console.log('=== START SYNCING LOCATIONS ===');

  try {
    // 1. Fetch data from hanhchinhvn
    console.log('Fetching standard location data...');
    const response = await fetch('https://raw.githubusercontent.com/madnh/hanhchinhvn/master/dist/tree.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const treeData = await response.json() as Record<string, any>;

    const existingLocations = await prisma.location.findMany();
    const existingMap = new Map();
    for (const loc of existingLocations) {
      existingMap.set(`${loc.name.toLowerCase()}-${loc.type}-${loc.parentId || ''}`, loc.id);
    }

    let addedProvinces = 0;
    let addedDistricts = 0;
    let addedWards = 0;

    const provinceIdMap = new Map<string, string>(); 
    const districtIdMap = new Map<string, string>(); 

    for (const pCode of Object.keys(treeData)) {
      const pData = treeData[pCode];
      const pName = pData.name_with_type;
      
      let pId = existingMap.get(`${pName.toLowerCase()}-CITY-`) || existingMap.get(`${pName.toLowerCase()}-PROVINCE-`);
      if (!pId) {
        // Find by name in case type mismatch
        let check = await prisma.location.findFirst({ where: { name: pName }});
        if (check) {
            pId = check.id;
        } else {
            const pRecord = await prisma.location.create({
            data: { name: pName, type: 'CITY' } 
            });
            pId = pRecord.id;
            addedProvinces++;
        }
      }
      provinceIdMap.set(pCode, pId);

      const districts = pData['quan-huyen'] || {};
      for (const dCode of Object.keys(districts)) {
        const dData = districts[dCode];
        const dName = dData.name_with_type;

        let dId = existingMap.get(`${dName.toLowerCase()}-DISTRICT-${pId}`);
        if (!dId) {
          let check = await prisma.location.findFirst({ where: { name: dName, parentId: pId }});
          if (check) {
              dId = check.id;
          } else {
              const dRecord = await prisma.location.create({
                data: { name: dName, type: 'DISTRICT', parentId: pId }
              });
              dId = dRecord.id;
              addedDistricts++;
          }
        }
        districtIdMap.set(dCode, dId);

        const wards = dData['xa-phuong'] || {};
        const wardDataToInsert: { name: string, type: string, parentId: string }[] = [];
        for (const wCode of Object.keys(wards)) {
          const wData = wards[wCode];
          const wName = wData.name_with_type;

          let wId = existingMap.get(`${wName.toLowerCase()}-WARD-${dId}`);
          if (!wId) {
            wardDataToInsert.push({ name: wName, type: 'WARD', parentId: dId });
          }
        }

        if (wardDataToInsert.length > 0) {
          // Verify if they exist using findMany to be extremely safe against duplicate rows inserted by seed.ts
          const existingWards = await prisma.location.findMany({
              where: { parentId: dId, type: 'WARD' }
          });
          const existingWardNames = existingWards.map(w => w.name.toLowerCase());
          const finalInsert = wardDataToInsert.filter(w => !existingWardNames.includes(w.name.toLowerCase()));

          if (finalInsert.length > 0) {
              await prisma.location.createMany({
                data: finalInsert
              });
              addedWards += finalInsert.length;
          }
        }
      }
    }

    console.log(`Added ${addedProvinces} provinces, ${addedDistricts} districts, ${addedWards} wards.`);

    // 2. Read old_wards_nghean.json and insert them
    console.log('Syncing old wards for Nghệ An...');
    const oldWardsPath = path.join(__dirname, '..', 'prisma', 'data', 'old_wards_nghean.json');
    if (fs.existsSync(oldWardsPath)) {
      const oldWardsStr = fs.readFileSync(oldWardsPath, 'utf8');
      const oldWardsData = JSON.parse(oldWardsStr); 

      let addedOldWards = 0;
      for (const oldWard of oldWardsData) {
        let pId = existingMap.get(`tỉnh nghệ an-CITY-`) || existingMap.get(`tỉnh nghệ an-PROVINCE-`);
        if (!pId) {
            const ngh = await prisma.location.findFirst({ where: { name: 'Tỉnh Nghệ An' }});
            if (ngh) pId = ngh.id;
        }

        if (pId) {
          const dRecord = await prisma.location.findFirst({
            where: { name: oldWard.districtName, parentId: pId, type: 'DISTRICT' }
          });

          if (dRecord) {
            const wId = existingMap.get(`${oldWard.name.toLowerCase()}-OLD_WARD-${dRecord.id}`);
            if (!wId) {
              const checkOld = await prisma.location.findFirst({
                 where: { name: oldWard.name, type: 'OLD_WARD', parentId: dRecord.id }
              });
              if (!checkOld) {
                  await prisma.location.create({
                    data: { name: oldWard.name, type: 'OLD_WARD', parentId: dRecord.id }
                  });
                  addedOldWards++;
              }
            }
          } else {
            console.warn(`Could not find district ${oldWard.districtName} in Nghệ An.`);
          }
        }
      }
      console.log(`Added ${addedOldWards} OLD_WARDs.`);
    } else {
      console.log('No old_wards_nghean.json found, skipping.');
    }

    console.log('=== SYNC LOCATIONS COMPLETED ===');
  } catch (error) {
    console.error('Error syncing locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncLocations();
