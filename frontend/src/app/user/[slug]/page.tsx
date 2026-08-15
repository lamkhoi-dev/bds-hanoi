import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Star, MapPin, Calendar, Phone } from 'lucide-react';
import { serverApiUrl } from '@/lib/server-api';
import { formatPrice, formatArea, generateSlug } from '@/lib/utils';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const res = await fetch(serverApiUrl(`/users/public/${resolvedParams.slug}`), {
      next: { revalidate: 0 },
    });
    
    if (!res.ok) {
      return {
        title: 'User not found',
      };
    }
    
    const user = await res.json();
    
    const title = `${user.name} | Hồ sơ cá nhân`;
    const description = user.bio || `Xem hồ sơ và các tin đăng bất động sản từ ${user.name}`;
    const ogImage = user.avatar || 'https://i.pravatar.cc/150?img=11';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        images: [
          {
            url: ogImage,
            width: 800,
            height: 600,
            alt: user.name,
          },
        ],
      },
    };
  } catch (error) {
    return {
      title: 'User not found',
    };
  }
}

// Public Profile Page
export default async function UserPublicProfile({ params, searchParams }: PageProps) {
  try {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const res = await fetch(serverApiUrl(`/users/public/${resolvedParams.slug}`), {
      next: { revalidate: 0 }, // dynamic
    });
    if (!res.ok) throw new Error('User not found');
    const user = await res.json();
    
    // Pagination logic
    const pageParam = firstParam(resolvedSearchParams.page);
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const itemsPerPage = 6; // Set items per page here
    const totalPages = Math.ceil((user.properties?.length || 0) / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const currentItems = user.properties?.slice(startIndex, startIndex + itemsPerPage) || [];

    return (
      <div className="min-h-screen bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: User Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-borderLight text-center sticky top-24">
              <div className="relative w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-primary/20">
                <img 
                  src={user.avatar || 'https://i.pravatar.cc/150?img=11'} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-1.5">
                {user.name}
                {user.role === 'ADMIN' && (
                  <span title="Admin"><Star size={16} className="text-yellow-500 fill-current" /></span>
                )}
                {user.role === 'MOD' && (
                  <span title="Moderator"><Star size={16} className="text-blue-500 fill-current" /></span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mb-3 flex items-center justify-center gap-1.5">
                <Calendar size={14} /> Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </p>
              
              {user.bio && (
                <p className="text-sm text-gray-600 mb-6 italic px-2">"{user.bio}"</p>
              )}
              {!user.bio && <div className="mb-6"></div>}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-primary">{user._count.properties}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide text-center">Đang bán</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-green-600">{user.soldCount || 0}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide text-center">Đã bán</span>
                  </div>
                </div>
                
                {user.phone && user.isPhoneVisible && (
                  <div className="flex flex-col gap-2">
                    <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 transition-colors">
                      <Phone size={18} /> Gọi điện
                    </a>
                    <a href={`https://zalo.me/${user.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.115 11.233C21.115 6.697 17.067 3.013 12.062 3.013C7.057 3.013 3 6.697 3 11.233C3 14.542 5.253 17.391 8.528 18.736L7.753 21.053L10.378 19.348C10.923 19.424 11.488 19.467 12.062 19.467C17.067 19.467 21.115 15.772 21.115 11.233Z" fill="currentColor"/></svg>
                      Nhắn Zalo
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Properties List */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-2xl font-extrabold text-textMain mb-2">Tin đăng của {user.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentItems.map((item: any) => (
                <Link key={item.id} href={`/tin/${generateSlug(item.title)}--${item.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 border border-borderLight hover:-translate-y-1 block">
                  <div className="relative h-[240px] overflow-hidden">
                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md flex items-center gap-1 z-10">
                      <Star className="w-3.5 h-3.5 fill-current" /> {item.tier === 'VIP' ? 'VIP' : 'NORMAL'}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-3">
                      <p className="text-white font-extrabold text-xl">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base mb-3 text-textMain group-hover:text-primary transition-colors line-clamp-2 leading-snug">{item.title}</h3>
                    <p className="text-sm text-textSecondary mb-4 flex items-center gap-1.5">
                      <MapPin size={16} className="text-accent" /> {item.district ? `${item.district}, ${item.city}` : item.city || 'Chưa cập nhật'}
                    </p>
                    <div className="flex justify-between items-center text-sm text-textSecondary border-t border-borderLight/50 pt-3">
                      <span>{formatArea(item.area)}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {user.properties.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                  <p>Người dùng này chưa có tin đăng nào.</p>
                </div>
              )}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Link 
                    key={i} 
                    href={`/${resolvedParams.slug}?page=${i + 1}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors ${page === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-white text-textSecondary hover:bg-gray-100 border border-borderLight'}`}
                  >
                    {i + 1}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    );
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-gray-500 mb-6">Không tìm thấy thông tin người dùng.</p>
          <Link href="/" className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Về trang chủ</Link>
        </div>
      </div>
    );
  }
}
