import { toMediaUrl } from '@/lib/media';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightLeft, Phone, MessageCircle } from 'lucide-react';
import { generateSlug } from '@/lib/utils';

interface PropertyContactBoxProps {
  property: any;
  userPhone: string;
  blurredPhone: string;
  showPhone: boolean;
  isSaved: boolean;
  handleRevealPhone: () => void;
  handleCall: () => void;
  handleZalo: () => void;
  handleSave: () => void;
  addCompareItem: (item: any) => void;
}

export default function PropertyContactBox({
  property,
  userPhone,
  blurredPhone,
  showPhone,
  isSaved,
  handleRevealPhone,
  handleCall,
  handleZalo,
  handleSave,
  addCompareItem,
}: PropertyContactBoxProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card text-center">
      <Link href={`/user/${generateSlug(property.user?.name || 'user')}-${property.user?.id || ''}`} className="block group">
        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden relative" title={`Tên: ${property.user?.name || 'Ẩn danh'} - Tham gia: ${new Date(property.user?.createdAt || Date.now()).getFullYear()}`}>
          {property.user?.avatar ? (
            <Image fill src={toMediaUrl(property.user.avatar)} className="object-cover group-hover:scale-110 transition-transform" alt="Avatar" />
          ) : (
            <svg className="w-full h-full text-gray-400 p-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          )}
        </div>
        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{property.user?.name || 'Người đăng ẩn danh'}</h3>
      </Link>
      <p className="text-sm text-gray-500 mb-6">Đã tham gia {new Date(property.user?.createdAt || Date.now()).toLocaleDateString('vi-VN')}</p>
      
      {!showPhone ? (
        <button 
          onClick={handleRevealPhone}
          disabled={blurredPhone === 'Đã ẩn'}
          className="w-full btn-shimmer bg-gradient-to-r from-accent to-accent-light text-white font-bold py-3 rounded-xl hover:shadow-glow-accent transition-all flex justify-center items-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Phone className="w-5 h-5" />
          {blurredPhone === 'Đã ẩn' ? 'Đã ẩn số điện thoại' : `${blurredPhone} (Bấm để hiện số)`}
        </button>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          <a href={userPhone === 'Đã ẩn' ? '#' : `tel:${userPhone}`} onClick={userPhone === 'Đã ẩn' ? (e) => e.preventDefault() : handleCall} className={`w-full text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 ${userPhone === 'Đã ẩn' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>
            <Phone className="w-5 h-5" />
            {userPhone === 'Đã ẩn' ? 'Đã ẩn số' : `Gọi ngay: ${userPhone}`}
          </a>
          <a href={userPhone === 'Đã ẩn' ? '#' : `https://zalo.me/${userPhone}`} onClick={userPhone === 'Đã ẩn' ? (e) => e.preventDefault() : handleZalo} target={userPhone === 'Đã ẩn' ? "_self" : "_blank"} rel="noopener noreferrer" className={`w-full text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 ${userPhone === 'Đã ẩn' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
            <MessageCircle className="w-5 h-5" />
            Nhắn Zalo
          </a>
        </div>
      )}

      <button onClick={handleSave} className={`w-full font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 ${isSaved ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-50 border border-borderLight text-textSecondary hover:bg-gray-100'}`}>
        <svg className={`w-5 h-5 ${isSaved ? 'fill-current' : 'fill-none stroke-currentColor'}`} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        {isSaved ? 'Đã lưu tin' : 'Lưu tin'}
      </button>

      <button 
        onClick={() => addCompareItem({
          id: property.id,
          title: property.title,
          price: property.price,
          images: property.imageObjects?.length > 0 
            ? property.imageObjects.map((img: any) => toMediaUrl(img.url)) 
            : property.images?.map((url: string) => toMediaUrl(url)) || []
        })} 
        className="w-full mt-3 bg-blue-50 text-blue-600 border border-blue-200 font-bold py-3 rounded-xl hover:bg-blue-100 transition-all flex justify-center items-center gap-2"
      >
        <ArrowRightLeft className="w-5 h-5" />
        Thêm vào so sánh
      </button>
    </div>
  );
}
