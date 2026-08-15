import { MetadataRoute } from 'next';
import { generateSlug } from '@/lib/utils';
import { serverApiUrl } from '@/lib/server-api';



export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nhadatxunghe.vn';
  let propertyUrls: MetadataRoute.Sitemap = [];
  let globalLatestDate: Date | undefined;

  const updateGlobalDate = (dateStr?: string) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    if (!globalLatestDate || date > globalLatestDate) {
      globalLatestDate = date;
    }
  };

  try {
    const res = await fetch(serverApiUrl('/properties/sitemap'), { next: { revalidate: 3600 } });
    if (res.ok) {
      const properties = await res.json();
      propertyUrls = properties.map((property: any) => {
        const urlObj: any = {
          url: `${baseUrl}/tin/${generateSlug(property.title)}--${property.id}`,
          changeFrequency: 'daily',
          priority: property.tier === 'VIP' ? 0.9 : 0.7,
        };
        if (property.updatedAt) {
          urlObj.lastModified = new Date(property.updatedAt);
          updateGlobalDate(property.updatedAt);
        } else if (property.createdAt) {
          urlObj.lastModified = new Date(property.createdAt);
          updateGlobalDate(property.createdAt);
        }
        return urlObj;
      });
    }
  } catch {
    propertyUrls = [];
  }

  let newsUrls: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(serverApiUrl('/news?page=1&limit=5000'), { next: { revalidate: 3600 } });
    if (res.ok) {
      const { data } = await res.json();
      if (Array.isArray(data)) {
        newsUrls = data.map((item: any) => {
          const urlObj: any = {
            url: `${baseUrl}/news/${item.slug}`,
            changeFrequency: 'daily',
            priority: 0.7,
          };
          if (item.updatedAt) {
            urlObj.lastModified = new Date(item.updatedAt);
            updateGlobalDate(item.updatedAt);
          } else if (item.createdAt) {
            urlObj.lastModified = new Date(item.createdAt);
            updateGlobalDate(item.createdAt);
          }
          return urlObj;
        });
      }
    }
  } catch {
    newsUrls = [];
  }

  if (!globalLatestDate) {
    globalLatestDate = new Date();
  }

  const categoriesList = ['dat-nen', 'nha-rieng', 'chung-cu', 'du-an', 'mat-bang-kho-xuong', 'bds-khac'];
  const seoCategoriesForLocations = [...categoriesList, 'cho-thue'];

  let locationUrls: MetadataRoute.Sitemap = [];
  try {
    const locationRes = await fetch(serverApiUrl('/locations'), { next: { revalidate: 3600 } });
    if (locationRes.ok) {
      const locations = await locationRes.json();
      
      const allowedCities = ['Nghệ An', 'Hà Tĩnh'];
      const citySlugs = new Set<string>();

      const processLocation = (loc: any) => {
        if (loc.slug) {
          locationUrls.push({
            url: `${baseUrl}/${loc.slug}`,
            lastModified: globalLatestDate,
            changeFrequency: 'daily',
            priority: 0.8,
          });
          seoCategoriesForLocations.forEach((cat) => {
            locationUrls.push({
              url: `${baseUrl}/${cat}/${loc.slug}`,
              lastModified: globalLatestDate,
              changeFrequency: 'daily',
              priority: 0.8,
            });
          });
        }
        if (loc.children) {
          loc.children.forEach(processLocation);
        }
      };

      locations.forEach((dist: any) => {
        if (dist.parent && allowedCities.includes(dist.parent.name)) {
          if (dist.parent.name === 'Nghệ An' && !citySlugs.has('nghe-an')) {
            citySlugs.add('nghe-an');
            processLocation({ slug: 'nghe-an' });
          } else if (dist.parent.name === 'Hà Tĩnh' && !citySlugs.has('ha-tinh')) {
            citySlugs.add('ha-tinh');
            processLocation({ slug: 'ha-tinh' });
          }
          processLocation(dist);
        }
      });
    }
  } catch {
    locationUrls = [];
  }

  // Chuyên mục loại BĐS độc lập
  const categoryUrls: MetadataRoute.Sitemap = categoriesList.map(cat => ({
    url: `${baseUrl}/${cat}`,
    lastModified: globalLatestDate,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: globalLatestDate, changeFrequency: 'always', priority: 1 },
    { url: `${baseUrl}/news`, lastModified: globalLatestDate, changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/toan-bo-tin`, lastModified: globalLatestDate, changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/ban`, lastModified: globalLatestDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/cho-thue`, lastModified: globalLatestDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/support/pricing`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/terms`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/privacy`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/rules`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/posting-policy`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/payment-policy`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/refund-policy`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/complaints`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/support/data-deletion`, lastModified: globalLatestDate, changeFrequency: 'monthly', priority: 0.5 },
  ];

  return [
    ...staticUrls,
    ...categoryUrls,
    ...locationUrls,
    ...propertyUrls,
    ...newsUrls,
  ];
}
