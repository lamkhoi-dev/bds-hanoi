import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging' || baseUrl.includes('staging');

  if (isStaging) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/login', '/register', '/forgot-password', '/change-password'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
