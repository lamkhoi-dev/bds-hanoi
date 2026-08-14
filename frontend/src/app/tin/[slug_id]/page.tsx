import type { Metadata } from 'next';
import PropertyDetailClient from './PropertyDetailClient';
import { serverApiUrl } from '@/lib/server-api';
import { toMediaUrl } from '@/lib/media';
import ExploreMoreContextual from '@/components/ExploreMoreContextual';
import { generateSlug } from '@/lib/utils';
import { notFound, permanentRedirect } from 'next/navigation';
import { siteConfig } from '@/lib/site-config';
import { listingDetailPath, parseListingRef } from '@/lib/seo/canonical';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/Breadcrumb';
import { buildBreadcrumbList, buildRealEstateListing } from '@/lib/seo/schema';
import { listingBreadcrumb } from '@/lib/seo/breadcrumb-items';

type PageProps = {
  params: Promise<{
    slug_id: string;
  }>;
};

async function getProperty(slugId: string) {
  // Nhận cả URL cũ `{slug}--{uuid}` lẫn URL mới `{slug}-{shortCode}`.
  const { ref } = parseListingRef(slugId ?? '');
  if (!ref) return null;

  try {
    const res = await fetch(serverApiUrl(`/properties/${encodeURIComponent(ref)}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
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
      title: 'Không tìm thấy tin đăng',
      robots: { index: false, follow: true },
    };
  }

  // Tin đã bán/đã cho thuê: trang vẫn mở được cho người đã lưu link và link nội bộ vẫn
  // chảy (follow), nhưng không index và không nằm trong sitemap — xem INDEXABLE_STATUSES
  // ở backend/src/seo/seo.service.ts. Tin EXPIRED/DELETED thì backend đã trả 404.
  const isClosed = property.status === 'SOLD' || property.status === 'RENTED';

  // Canonical tương đối: metadataBase trong layout.tsx tự ghép domain, nên không còn
  // chỗ nào tự nối chuỗi domain (và nối nhầm sang domain khác).
  const canonical = listingDetailPath(generateSlug(property.title), property.shortCode, property.id);
  const description = getDescription(property);
  const image = Array.isArray(property.imageObjects) && property.imageObjects.length > 0 
    ? property.imageObjects[0].url 
    : (Array.isArray(property.images) && property.images.length > 0 ? toMediaUrl(property.images[0]) : undefined);

  return {
    title: property.title,
    description,
    ...(isClosed ? { robots: { index: false, follow: true } } : {}),
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

  // Trước đây trả 200 kèm noindex — Google gọi đó là soft 404 và vẫn giữ URL trong
  // hàng đợi crawl. Tin không tồn tại phải là 404 thật.
  if (!property) {
    notFound();
  }

  // URL chuẩn là dạng NGẮN. Mọi biến thể khác — kể cả toàn bộ URL cũ `--{uuid}` đang
  // được Google index — đều 301 về đây. Khách yêu cầu rút gọn đuôi link kèm điều kiện
  // "giữ ID cố định và chuyển hướng 301": bản ghi không đổi id, chỉ đổi cách địa chỉ hoá.
  const expectedSlug = generateSlug(property.title);
  const expectedPath = listingDetailPath(expectedSlug, property.shortCode, property.id);
  if (`/tin/${resolvedParams.slug_id}` !== expectedPath) {
    permanentRedirect(expectedPath);
  }

  // JSON-LD cần URL tuyệt đối — Next không resolve URL bên trong khối ld+json.
  const canonical = siteConfig.absolute(expectedPath);

  // Breadcrumb đầy đủ: Trang chủ / Giao dịch / Loại BĐS / Quận-Huyện / Phường-Xã / Tiêu đề.
  // Trước đây chỉ có 3 cấp và trỏ sang /tat-ca (không nằm trong sitemap).
  const breadcrumbItems = listingBreadcrumb(property);

  return (
    <>
      <JsonLd
        graph={[
          buildBreadcrumbList(breadcrumbItems, `${canonical}#breadcrumb`),
          buildRealEstateListing(property, {
            url: canonical,
            description: getDescription(property),
          }),
        ]}
      />
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>
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
