"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { uploadImage } from '@/lib/upload';
import Image from 'next/image';
import SimpleEditor from '@/components/SimpleEditor';
import LocationPicker, { resolveLocationIds, LocationValue } from '@/components/LocationPicker';
import { siteConfig } from '@/lib/site-config';

const PROVINCE_NAME = siteConfig.province.name;

export default function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [status, setStatus] = useState<'VISIBLE' | 'HIDDEN'>('VISIBLE');
  const [locations, setLocations] = useState<any[]>([]);
  const [location, setLocation] = useState<LocationValue>({ city: PROVINCE_NAME, district: '', ward: '', oldWard: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/locations').then(res => setLocations(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/admin/${id}`);
        const p = res.data;
        setName(p.name);
        setDescription(p.description);
        setThumbnail(p.thumbnail || '');
        setStatus(p.status);
        setLocation({
          city: p.city || PROVINCE_NAME,
          district: p.district || '',
          ward: p.ward || '',
          oldWard: p.oldWard || '',
        });
      } catch (error) {
        console.error(error);
        toast.error('Lỗi khi tải thông tin dự án');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setThumbnail(url);
      toast.success('Tải ảnh lên thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error('Vui lòng nhập tên và mô tả dự án');
      return;
    }
    if (!location.district) {
      toast.error('Vui lòng chọn Khu vực cho dự án');
      return;
    }

    setIsSubmitting(true);
    try {
      const { provinceId, districtId, wardId } = resolveLocationIds(locations, location);
      await api.put(`/projects/${id}`, {
        name,
        description,
        thumbnail,
        status,
        city: location.city,
        district: location.district,
        ward: location.ward,
        oldWard: location.oldWard,
        provinceId,
        districtId,
        wardId,
      });
      toast.success('Đã cập nhật dự án');
      router.push('/admin/projects');
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi cập nhật dự án: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/projects" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Sửa Dự Án</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Tên dự án <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="VD: Vinhomes Riverside"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Ảnh đại diện</label>
          <div className="flex items-start gap-4">
            <div className="relative w-40 h-28 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {thumbnail ? (
                <Image src={thumbnail} alt="Thumbnail" fill className="object-cover" />
              ) : (
                <ImageIcon className="text-gray-400" size={32} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                {isUploading ? 'Đang tải lên...' : 'Chọn ảnh'}
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploading} />
              </label>
              <p className="text-xs text-gray-500">Kích thước khuyến nghị: 800x450px. Tối đa 5MB.</p>
              {thumbnail && (
                <button type="button" onClick={() => setThumbnail('')} className="text-red-500 text-sm font-medium block">
                  Xoá ảnh
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Địa điểm <span className="text-red-500">*</span></label>
          <LocationPicker
            locations={locations}
            value={location}
            onChange={setLocation}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Mô tả dự án <span className="text-red-500">*</span></label>
          <div className="h-[400px] mb-12">
            <SimpleEditor
              value={description}
              onChange={setDescription}
              className="h-full rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'VISIBLE' | 'HIDDEN')}
            className="w-full md:w-64 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="VISIBLE">Hiển thị</option>
            <option value="HIDDEN">Ẩn</option>
          </select>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
        </div>
      </form>
    </div>
  );
}
