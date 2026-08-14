"use client";

import { useState } from 'react';
import { PROPERTY_TYPES } from '@/lib/seo/taxonomy';
import { notFound, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast or just use alert
import { Building, MapPin, Tag, Maximize, Edit3, Phone, User, Mail } from 'lucide-react';

export default function SubmitRequirementPage() {
  notFound();
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'CAN_MUA',
    propertyType: 'NHA_RIENG',
    name: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    priceMin: '',
    priceMax: '',
    areaMin: '',
    areaMax: '',
    description: '' // This will map to content or description
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.propertyType || !formData.transactionType) {
      toast.error('Vui lòng nhập đủ thông tin bắt buộc (SĐT, Loại BĐS, Hình thức)');
      return;
    }

    setLoading(true);
    try {
      // The backend uses contentLines to build the content from title, description, etc.
      // But we can just send description and the backend will append it.
      // We can append province, district, ward into the description.
      const locationText = [formData.province, formData.district, formData.ward]
        .filter(Boolean)
        .join(', ');
      
      const payload = {
        ...formData,
        description: locationText 
          ? `Khu vực: ${locationText}. \nChi tiết: ${formData.description}`
          : formData.description
      };

      await api.post('/requirements', payload);
      toast.success('Gửi yêu cầu thành công!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-primary px-8 py-6 text-white text-center">
          <h1 className="text-2xl font-bold">Gửi Yêu Cầu Tìm Nhà</h1>
          <p className="text-sm mt-2 text-primary-content/80">Chúng tôi sẽ giúp bạn tìm kiếm bất động sản phù hợp nhất</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Thông tin liên hệ */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Thông tin liên hệ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="Nhập họ tên..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-danger">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="Nhập số điện thoại..." />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="Nhập email..." />
                </div>
              </div>
            </div>
          </div>

          {/* Nhu cầu */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Thông tin nhu cầu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức <span className="text-danger">*</span></label>
                <select name="transactionType" value={formData.transactionType} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none">
                  <option value="CAN_MUA">Cần Mua</option>
                  <option value="CAN_THUE">Cần Thuê</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại bất động sản <span className="text-danger">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={16} className="text-gray-400" />
                  </div>
                  <select name="propertyType" required value={formData.propertyType} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none">
                    {/* Trước đây gửi giá trị kiểu 'Nha-rieng' — không khớp enum nào
                        backend dùng, nên 2 trang quản lý nhu cầu hiển thị nguyên chuỗi
                        thô thay vì nhãn. Nay gửi đúng enum. */}
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.enum} value={t.enum}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Khu vực */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Khu vực tìm kiếm</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                <input type="text" name="province" value={formData.province} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="VD: Hà Nội" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="VD: Cầu Giấy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                <input type="text" name="ward" value={formData.ward} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="VD: Dịch Vọng" />
              </div>
            </div>
          </div>

          {/* Mức giá & Diện tích */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Khoảng giá & Diện tích</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá từ (Triệu VNĐ)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag size={16} className="text-gray-400" />
                  </div>
                  <input type="number" name="priceMin" value={formData.priceMin} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="VD: 1000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá đến (Triệu VNĐ)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag size={16} className="text-gray-400" />
                  </div>
                  <input type="number" name="priceMax" value={formData.priceMax} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="VD: 5000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích từ (m²)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Maximize size={16} className="text-gray-400" />
                  </div>
                  <input type="number" name="areaMin" value={formData.areaMin} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="VD: 50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích đến (m²)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Maximize size={16} className="text-gray-400" />
                  </div>
                  <input type="number" name="areaMax" value={formData.areaMax} onChange={handleChange} className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="VD: 200" />
                </div>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu chi tiết</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none" placeholder="Mô tả thêm về nhu cầu của bạn (hướng nhà, tiện ích, hẻm xe hơi, ...)"></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition duration-300 flex items-center justify-center">
            {loading ? 'Đang xử lý...' : 'GỬI YÊU CẦU'}
          </button>
        </form>
      </div>
    </div>
  );
}
