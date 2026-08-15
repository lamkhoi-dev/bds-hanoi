"use client";
import { formatNumberString } from '@/lib/utils';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { format } from 'date-fns';

const translateAction = (action: string) => {
  const map: Record<string, string> = {
    'PROPERTY_PHONE_REVEAL': 'Lấy số điện thoại (BĐS)',
    'ADMIN_ADJUST_BALANCE': 'Cộng/Trừ tiền',
    'ADMIN_UPDATE_USER': 'Cập nhật User',
    'ADMIN_APPROVE_POST': 'Duyệt bài đăng',
    'ADMIN_REJECT_POST': 'Từ chối bài đăng',
    'ADMIN_DELETE_POST': 'Xóa bài đăng',
    'APPROVE_PROPERTY': 'Duyệt bài đăng',
    'REJECT_PROPERTY': 'Từ chối bài đăng',
    'DELETE_PROPERTY': 'Xóa bài đăng',
    'CREATE_PROPERTY': 'Đăng bài mới',
    'UPDATE_REQUIREMENT_STATUS': 'Cập nhật trạng thái nhu cầu',
    'ADMIN_RESET_USER_PASSWORD': 'Đặt lại mật khẩu',
    'POST_CREATE': 'Tạo tin mới',
    'USER_LOGIN': 'Đăng nhập',
    'USER_REGISTER': 'Đăng ký',
  };
  return map[action] || action;
};

const translateEntity = (type: string, id: string, entityName?: string) => {
  if (!type || !id) return '';
  const typeMap: Record<string, string> = {
    'PROPERTY': 'Bài đăng',
    'Property': 'Bài đăng',
    'User': 'Người dùng',
    'POST': 'Bài đăng',
    'Requirement': 'Nhu cầu khách',
    'REQUIREMENT': 'Nhu cầu khách'
  };
  
  const displayType = typeMap[type] || type;
  if (entityName) {
    return `${displayType}: ${entityName}`;
  }
  return `${displayType} (${id.substring(0, 8)})`;
};

const formatMetadata = (metadata: string) => {
  if (!metadata) return '';
  try {
    const data = JSON.parse(metadata);
    const parts = [];
    
    // Xử lý các trạng thái duyệt/kết nối
    if (data.status) {
      const statusMap: Record<string, string> = {
        'APPROVED': 'Đã duyệt',
        'REJECTED': 'Từ chối',
        'PENDING': 'Chờ duyệt',
        'MATCHED': 'Đã kết nối',
        'CLOSED': 'Đã đóng'
      };
      parts.push(`Trạng thái: ${statusMap[data.status] || data.status}`);
    }

    if (data.channel === 'ZALO') parts.push('Qua Zalo');
    else if (data.channel === 'PHONE_REVEAL') parts.push('Bấm xem số trực tiếp');
    else if (data.channel) parts.push(`Qua ${data.channel}`);
    
    if (data.amount !== undefined) parts.push(`Số tiền: ${data.amount > 0 ? '+' : ''}${formatNumberString(data.amount)}đ`);
    if (data.balanceBefore !== undefined && data.balanceAfter !== undefined) {
      parts.push(`(Số dư: ${formatNumberString(data.balanceBefore)}đ ➔ ${formatNumberString(data.balanceAfter)}đ)`);
    }
    if (data.adminNote) parts.push(`Ghi chú: ${data.adminNote}`);
    
    if (data.role) parts.push(`Cấp quyền: ${data.role}`);
    if (data.fullName) parts.push(`Tên: ${data.fullName}`);
    if (data.phone) parts.push(`SĐT: ${data.phone}`);
    
    if (parts.length > 0) return parts.join(' | ');
    
    // Nếu không khớp cái nào ở trên thì in ra bình thường nhưng cố gắng dịch key
    return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(', ');
  } catch(e) {
    return metadata;
  }
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=20`);
      setLogs(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Nhật ký Hoạt động (Audit Logs)</h1>
      
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="admin-mobile-table w-full text-left bg-white rounded shadow p-4 md:min-w-[800px]">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-sm font-semibold">Thời gian</th>
                  <th className="p-2 text-sm font-semibold">Người thao tác</th>
                  <th className="p-2 text-sm font-semibold">Hành động</th>
                  <th className="p-2 text-sm font-semibold">Tác động lên</th>
                  <th className="p-2 text-sm font-semibold">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td data-label="Thời gian" className="p-2 text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td data-label="Người thao tác" className="p-2 text-sm font-mono text-blue-600 font-medium">
                      {log.actor?.name || log.actor?.fullName || log.actorId?.substring(0, 8) || 'Hệ thống'}
                    </td>
                    <td data-label="Hành động" className="p-2">
                      <span className="px-2 py-1 text-xs rounded border bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
                        {translateAction(log.action)}
                      </span>
                    </td>
                    <td data-label="Tác động lên" className="p-2 text-sm font-medium text-gray-700">
                      {translateEntity(log.entityType, log.entityId, log.entityName)}
                    </td>
                    <td data-label="Chi tiết thay đổi" className="p-2 text-sm text-gray-600" title={log.metadata}>
                      {formatMetadata(log.metadata)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-500">Chưa có nhật ký nào</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Trước</button>
              <span className="text-sm">Trang {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Sau</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
