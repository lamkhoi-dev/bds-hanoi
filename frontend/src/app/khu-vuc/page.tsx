import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh sách khu vực Bất Động Sản Nghệ An & Hà Tĩnh',
  description: 'Tra cứu danh sách các khu vực bất động sản tại Nghệ An và Hà Tĩnh. Tìm kiếm bất động sản theo từng huyện, thị xã, thành phố.',
};

const NGHE_AN_AREAS = [
  { name: 'Thành phố Vinh', slug: 'thanh-pho-vinh' },
  { name: 'Thị xã Cửa Lò', slug: 'thi-xa-cua-lo' },
  { name: 'Thị xã Hoàng Mai', slug: 'thi-xa-hoang-mai' },
  { name: 'Thị xã Thái Hòa', slug: 'thi-xa-thai-hoa' },
  { name: 'Huyện Anh Sơn', slug: 'huyen-anh-son' },
  { name: 'Huyện Con Cuông', slug: 'huyen-con-cuong' },
  { name: 'Huyện Diễn Châu', slug: 'huyen-dien-chau' },
  { name: 'Huyện Đô Lương', slug: 'huyen-do-luong' },
  { name: 'Huyện Hưng Nguyên', slug: 'huyen-hung-nguyen' },
  { name: 'Huyện Kỳ Sơn', slug: 'huyen-ky-son' },
  { name: 'Huyện Nam Đàn', slug: 'huyen-nam-dan' },
  { name: 'Huyện Nghi Lộc', slug: 'huyen-nghi-loc' },
  { name: 'Huyện Nghĩa Đàn', slug: 'huyen-nghia-dan' },
  { name: 'Huyện Quế Phong', slug: 'huyen-que-phong' },
  { name: 'Huyện Quỳ Châu', slug: 'huyen-quy-chau' },
  { name: 'Huyện Quỳ Hợp', slug: 'huyen-quy-hop' },
  { name: 'Huyện Quỳnh Lưu', slug: 'huyen-quynh-luu' },
  { name: 'Huyện Tân Kỳ', slug: 'huyen-tan-ky' },
  { name: 'Huyện Thanh Chương', slug: 'huyen-thanh-chuong' },
  { name: 'Huyện Tương Dương', slug: 'huyen-tuong-duong' },
  { name: 'Huyện Yên Thành', slug: 'huyen-yen-thanh' },
];

const HA_TINH_AREAS = [
  { name: 'Thành phố Hà Tĩnh', slug: 'thanh-pho-ha-tinh' },
  { name: 'Thị xã Hồng Lĩnh', slug: 'thi-xa-hong-linh' },
  { name: 'Thị xã Kỳ Anh', slug: 'thi-xa-ky-anh' },
  { name: 'Huyện Cẩm Xuyên', slug: 'huyen-cam-xuyen' },
  { name: 'Huyện Can Lộc', slug: 'huyen-can-loc' },
  { name: 'Huyện Đức Thọ', slug: 'huyen-duc-tho' },
  { name: 'Huyện Hương Khê', slug: 'huyen-huong-khe' },
  { name: 'Huyện Hương Sơn', slug: 'huyen-huong-son' },
  { name: 'Huyện Kỳ Anh', slug: 'huyen-ky-anh' },
  { name: 'Huyện Lộc Hà', slug: 'huyen-loc-ha' },
  { name: 'Huyện Nghi Xuân', slug: 'huyen-nghi-xuan' },
  { name: 'Huyện Thạch Hà', slug: 'huyen-thach-ha' },
  { name: 'Huyện Vũ Quang', slug: 'huyen-vu-quang' },
];

export default function KhuVucPage() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-[1600px] mx-auto space-y-12">
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Khu vực Bất Động Sản</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lựa chọn khu vực bạn quan tâm để tìm kiếm các bất động sản đang bán mới nhất tại Nghệ An và Hà Tĩnh.
          </p>
        </div>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Tỉnh Nghệ An</h2>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">{NGHE_AN_AREAS.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {NGHE_AN_AREAS.map((area) => (
              <Link 
                href={`/${area.slug}`} 
                key={area.slug}
                className="bg-white p-4 rounded-xl border hover:border-primary hover:shadow-md transition-all group flex flex-col items-center text-center gap-2"
              >
                <span className="font-semibold text-gray-800 group-hover:text-primary">{area.name}</span>
                <span className="text-xs text-gray-500">Xem BĐS Bán</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Tỉnh Hà Tĩnh</h2>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">{HA_TINH_AREAS.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {HA_TINH_AREAS.map((area) => (
              <Link 
                href={`/${area.slug}`} 
                key={area.slug}
                className="bg-white p-4 rounded-xl border hover:border-primary hover:shadow-md transition-all group flex flex-col items-center text-center gap-2"
              >
                <span className="font-semibold text-gray-800 group-hover:text-primary">{area.name}</span>
                <span className="text-xs text-gray-500">Xem BĐS Bán</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
