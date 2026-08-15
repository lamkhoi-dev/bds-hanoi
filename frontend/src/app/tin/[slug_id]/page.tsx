import type { Metadata } from 'next';
import PropertyDetailClient from './PropertyDetailClient';
import { serverApiUrl } from '@/lib/server-api';
import { toMediaUrl } from '@/lib/media';
import ExploreMoreContextual from '@/components/ExploreMoreContextual';
import { generateSlug } from '@/lib/utils';
import { permanentRedirect } from 'next/navigation';

type PageProps = {
  params: Promise<{
    slug_id: string;
  }>;
};

async function getProperty(slugId: string) {
  const actualId = slugId ? slugId.split('--').pop() : '';
  if (!actualId) return null;

  try {
    const res = await fetch(serverApiUrl(`/properties/${actualId}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function getDescription(property: any) {
  const address = [property?.street, property?.ward, property?.district, property?.city]
    .filter(Boolean)
    .join(', ');
  const rawDescription = property?.description || address || 'Thong tin bat dong san dang ban, cho thue.';
  return String(rawDescription).replace(/\s+/g, ' ').slice(0, 155);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const property = await getProperty(resolvedParams.slug_id);

  if (!property) {
    return {
      title: 'Khong tim thay tin dang',
      robots: { index: false, follow: true },
    };
  }

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/tin/${generateSlug(property.title)}--${property.id}`;
  const description = getDescription(property);
  const image = Array.isArray(property.imageObjects) && property.imageObjects.length > 0 
    ? property.imageObjects[0].url 
    : (Array.isArray(property.images) && property.images.length > 0 ? toMediaUrl(property.images[0]) : undefined);

  return {
    title: property.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: property.title,
      description,
      url: canonical,
      type: 'article',
      images: image ? [{ url: image, alt: property.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: property.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const property = await getProperty(resolvedParams.slug_id);

  if (!property) {
    return <PropertyDetailClient initialProperty={null} />;
  }

  const expectedSlug = generateSlug(property.title);
  const actualId = property.id;
  if (resolvedParams.slug_id !== `${expectedSlug}--${actualId}`) {
    permanentRedirect(`/tin/${expectedSlug}--${actualId}`);
  }

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/tin/${expectedSlug}--${actualId}`;
  const image = Array.isArray(property.imageObjects) && property.imageObjects.length > 0 
    ? property.imageObjects[0].url 
    : (Array.isArray(property.images) && property.images.length > 0 ? toMediaUrl(property.images[0]) : undefined);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: getDescription(property),
    url: canonical,
    image: image,
    datePosted: property.createdAt,
    offers: {
      '@type': 'Offer',
      price: property.price || 0,
      priceCurrency: 'VND',
      availability: property.status === 'SOLD' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    },
  };

  const breadcrumbList = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Trang chủ",
      item: siteUrl
    },
    {
      "@type": "ListItem",
      position: 2,
      name: property.transactionType === 'BAN' ? 'Bán' : 'Cho thuê',
      item: `${siteUrl}${property.transactionType === 'BAN' ? '/tat-ca' : '/search?transactionType=CHO_THUE'}`
    },
    {
      "@type": "ListItem",
      position: 3,
      name: property.title,
      item: canonical
    }
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbList
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e'),
        }}
      />
      <PropertyDetailClient initialProperty={property} />
      
      {property && (
        <div className="container mx-auto px-4 pb-12">
          <ExploreMoreContextual 
            currentCategory={property.category}
            transactionType={property.transactionType}
            district={property.district}
            ward={property.ward}
          />
        </div>
      )}
    </>
  );
}
