import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { getLocationDictionary } from '@/lib/seo/locations';

// Trước đây trang này là hai mảng cứng 21 huyện Nghệ An + 13 huyện Hà Tĩnh, với slug
// tự đặt (`huyen-dien-chau`) không khớp urlSegment thật trong CSDL — bấm vào là ra
// trang rỗng. Giờ lấy thẳng từ /locations/segments.
export const metadata: Metadata = {
  title: `Danh sách khu vực bất động sản ${siteConfig.province.name}`,
  description: `Tra cứu danh sách quận, huyện, phường, xã tại ${siteConfig.province.name}. Tìm bất động sản theo từng khu vực.`,
  alternates: { canonical: '/khu-vuc' },
};

export const revalidate = 3600;

export default async function KhuVucPage() {
  const dict = await getLocationDictionary();

  const districts = Object.entries(dict)
    .filter(([, info]) => info.type === 'DISTRICT')
    .map(([slug, info]) => ({ slug, name: info.name }));

  // Nhóm phường/xã theo quận/huyện cha để danh sách còn đọc được ở quy mô ~700 mục.
  const wardsByDistrict = new Map<string, { slug: string; name: string }[]>();
  for (const [slug, info] of Object.entries(dict)) {
    if (info.type !== 'WARD' || !info.parent) continue;
    const list = wardsByDistrict.get(info.parent) ?? [];
    list.push({ slug, name: info.name });
    wardsByDistrict.set(info.parent, list);
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-[1600px] mx-auto space-y-12">
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Khu vực Bất Động Sản</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Chọn khu vực bạn quan tâm để xem các bất động sản đang rao bán tại{' '}
            {siteConfig.province.name}.
          </p>
        </div>

        {districts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500">
            Danh sách khu vực đang được cập nhật.
          </div>
        ) : (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{siteConfig.province.name}</h2>
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
                {districts.length}
              </span>
            </div>

            <div className="space-y-8">
              {districts.map((district) => {
                const wards = wardsByDistrict.get(district.slug) ?? [];
                return (
                  <div key={district.slug} className="bg-white rounded-xl border p-5">
                    <Link
                      href={`/${district.slug}`}
                      className="text-lg font-bold text-gray-800 hover:text-primary"
                    >
                      {district.name}
                    </Link>
                    {wards.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {wards.map((ward) => (
                          <Link
                            href={`/${ward.slug}`}
                            key={ward.slug}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors"
                          >
                            {ward.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
