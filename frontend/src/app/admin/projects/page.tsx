"use client";

import { useCallback, useEffect, useState } from 'react';
import { Edit, Plus, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/projects/admin/all');
      setProjects(res.data || []);
    } catch (e) {
      if (!isUnauthorizedError(e)) console.error(e);
      toast.error('Lỗi khi tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleToggleVisible = async (project: any) => {
    try {
      if (project.status === 'VISIBLE') {
        await api.delete(`/projects/${project.id}`);
        toast.success('Đã ẩn dự án');
      } else {
        await api.put(`/projects/${project.id}`, { status: 'VISIBLE' });
        toast.success('Đã hiện lại dự án');
      }
      fetchProjects();
    } catch (e) {
      if (!isUnauthorizedError(e)) console.error(e);
      toast.error('Lỗi khi cập nhật trạng thái dự án');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý Dự án</h1>
        <Link href="/admin/projects/create" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Thêm dự án mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table w-full md:min-w-[900px] text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Ảnh đại diện</th>
                <th className="px-6 py-4">Tên dự án</th>
                <th className="px-6 py-4">Địa điểm</th>
                <th className="px-6 py-4">Số tin</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4">Chưa có dự án nào</td></tr>
              ) : projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                  <td data-label="Ảnh đại diện" className="px-6 py-4">
                    <div className="h-12 w-20 relative rounded overflow-hidden bg-gray-100">
                      {project.thumbnail ? (
                        <Image src={project.thumbnail} alt={project.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">No img</div>
                      )}
                    </div>
                  </td>
                  <td data-label="Tên dự án" className="px-6 py-4">
                    <div className="font-bold text-gray-900 max-w-md truncate" title={project.name}>{project.name}</div>
                    <div className="text-gray-500 text-xs mt-1">Slug: {project.slug}</div>
                  </td>
                  <td data-label="Địa điểm" className="px-6 py-4">
                    <div className="text-gray-700">{[project.ward, project.district, project.city].filter(Boolean).join(', ') || '—'}</div>
                  </td>
                  <td data-label="Số tin" className="px-6 py-4">{project._count?.properties ?? 0}</td>
                  <td data-label="Trạng thái" className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${project.status === 'VISIBLE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {project.status === 'VISIBLE' ? 'Đang hiển thị' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td data-label="Thao tác" className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleToggleVisible(project)} className="inline-flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={project.status === 'VISIBLE' ? 'Ẩn dự án' : 'Hiện lại dự án'}>
                      {project.status === 'VISIBLE' ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <Link href={`/admin/projects/${project.id}`} className="inline-flex p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                      <Edit size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
