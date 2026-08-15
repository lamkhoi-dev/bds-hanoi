"use client";
import { formatNumberString } from '@/lib/utils';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';

export default function AdminWebhooksPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    api.get('/admin/payment-webhook-logs')
      .then((res) => {
        setLogs(res.data?.data || []);
        setTotal(res.data?.total || 0);
      })
      .catch((error) => {
        if (!isUnauthorizedError(error)) console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">SePay Webhook Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Lich su cac webhook tu SePay.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-mobile-table md:min-w-[860px] w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Reference ID</th>
                <th className="px-4 py-3">Loai</th>
                <th className="px-4 py-3 text-right">So tien</th>
                <th className="px-4 py-3">Trang thai</th>
                <th className="px-4 py-3">Li do / Noi dung</th>
                <th className="px-4 py-3">Ngay tao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Dang tai...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chua co log webhook</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td data-label="Reference ID" className="px-4 py-3">{log.referenceId || '-'}</td>
                  <td data-label="Loai" className="px-4 py-3 font-semibold">{log.transferType || '-'}</td>
                  <td data-label="So tien" className="px-4 py-3 text-right font-bold text-blue-600">
                    {log.transferAmount ? formatNumberString(Number(log.transferAmount)) + ' đ' : '-'}
                  </td>
                  <td data-label="Trang thai" className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                      log.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td data-label="Li do / Noi dung" className="px-4 py-3 max-w-sm">
                    <div className="truncate font-medium">{log.reason || '-'}</div>
                    <div className="truncate text-xs text-gray-500 mt-1">{log.content || '-'}</div>
                  </td>
                  <td data-label="Ngay tao" className="px-4 py-3 text-gray-500">{log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          Hien thi {logs.length} / {total} logs
        </div>
      </div>
    </div>
  );
}
