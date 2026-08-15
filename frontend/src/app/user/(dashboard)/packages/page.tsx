"use client";
import { formatNumberString } from '@/lib/utils';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

const formatCurrency = (val: number) => formatNumberString(val);

export default function Packages() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <h2 className="text-2xl font-extrabold text-textMain mb-6">Bảng giá & Gói Dịch Vụ</h2>
      
      <p className="text-gray-600 mb-8">
        Hệ thống hiện cung cấp các gói dịch vụ trực tiếp cho từng bài đăng của bạn. 
        Bạn có thể sử dụng các đặc quyền miễn phí hàng ngày hoặc nâng cấp VIP/UP để tiếp cận nhiều khách hàng hơn.
      </p>

      {/* Free Tier */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-bl-lg">
          MẶC ĐỊNH
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Gói Cơ Bản (Miễn Phí)</h3>
        <p className="text-sm text-gray-500 mb-6">Dành cho mọi thành viên khi đăng ký tài khoản mới.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm font-medium mb-1">Tin Miễn Phí</div>
            <div className="text-2xl font-bold text-primary">{settings?.freePostsPerDay || 0} <span className="text-base font-normal text-gray-500">tin / ngày</span></div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm font-medium mb-1">Lượt UP Miễn Phí</div>
            <div className="text-2xl font-bold text-primary">{settings?.freeUpsPerUserPerDay || 0} <span className="text-base font-normal text-gray-500">lượt / ngày</span></div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm font-medium mb-1">Tối đa tin đăng</div>
            <div className="text-2xl font-bold text-gray-800">{settings?.maxPostsPerDay || 0} <span className="text-base font-normal text-gray-500">tin / ngày</span></div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-gray-500 text-sm font-medium mb-1">Chờ UP tin</div>
            <div className="text-2xl font-bold text-gray-800">{settings?.upCooldownMinutes || 0} <span className="text-base font-normal text-gray-500">phút</span></div>
          </div>
        </div>
      </div>

      {/* Premium Services */}
      <h3 className="text-xl font-bold text-gray-800 mb-6">Nâng Cấp Dịch Vụ Cho Tin Đăng</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VIP Package */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md border border-orange-200 p-6 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
            CAO CẤP
          </div>
          
          <div className="flex items-center mb-4">
            <div className="bg-orange-500 text-white p-2 rounded-lg mr-3 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-orange-800">Gói VIP</h3>
          </div>
          
          <p className="text-orange-700/80 text-sm mb-6 h-10">
            Ghim tin đăng của bạn lên vị trí nổi bật trên cùng của danh sách tìm kiếm, giúp tiếp cận khách hàng nhanh chóng.
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-medium">Chi phí nâng cấp</span>
              <span className="text-2xl font-black text-orange-600">{settings?.vipPrice ? Math.floor(settings.vipPrice / 1000) + ' điểm' : '0 điểm'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Thời gian hiệu lực</span>
              <span className="text-lg font-bold text-gray-800">{settings?.vipDurationDays || 0} Ngày</span>
            </div>
          </div>
          
          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-orange-500 mr-2 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm text-gray-700">Hiển thị chữ VIP nổi bật</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-orange-500 mr-2 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm text-gray-700">Luôn đứng trên các tin thường trong mục tìm kiếm</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-orange-500 mr-2 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm text-gray-700">Gấp 5 lần lượt xem so với tin thông thường</span>
            </li>
          </ul>
        </div>

        {/* UP Package */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-6 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary text-white p-2 rounded-lg mr-3 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-primary">Đẩy UP</h3>
          </div>
          
          <p className="text-blue-800/70 text-sm mb-6 h-10">
            Làm mới tin đăng, đẩy tin của bạn lên đầu danh sách tin tức bình thường để tìm kiếm lại khách hàng tiềm năng.
          </p>
          
          <div className="bg-white/60 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-medium">Chi phí mỗi lượt</span>
              <span className="text-2xl font-black text-primary">{settings?.upPrice ? Math.floor(settings.upPrice / 1000) + ' điểm' : '0 điểm'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Thời hạn giữ TOP</span>
              <span className="text-lg font-bold text-gray-800">{settings?.upDurationDays || 0} Ngày</span>
            </div>
          </div>
          
          <ul className="space-y-3 mb-8">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary mr-2 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm text-gray-700">Thời gian đăng tin được cập nhật thành mới nhất</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-primary mr-2 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm text-gray-700">Cạnh tranh vị trí với các tin mới đăng khác</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
        <svg className="w-6 h-6 text-blue-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Để nâng cấp VIP hoặc Đẩy UP, bạn vui lòng truy cập vào danh sách <strong>Quản lý tin đăng</strong>, chọn tin cần nâng cấp và nhấn vào nút VIP/UP tương ứng. 
          Tiền sẽ được trừ trực tiếp vào <strong>Ví điện tử</strong> của bạn.
        </p>
      </div>
    </div>
  );
}
