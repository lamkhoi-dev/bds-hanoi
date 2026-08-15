"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { confirmAction } from '@/lib/toast-helpers';
import { Database, Zap, Package, Upload, Trash2, FolderOpen, Inbox, Download, RotateCcw, ClipboardList, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface BackupFile {
  name: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  type: string;
}

interface BackupLog {
  id: string;
  type: string;
  status: string;
  filePath: string | null;
  message: string | null;
  createdAt: string;
}

export default function BackupPage() {
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [restoreModal, setRestoreModal] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filesRes, logsRes] = await Promise.all([
        api.get('/admin/backup/files'),
        api.get('/admin/backup/logs?limit=20'),
      ]);
      setFiles(filesRes.data);
      setLogs(logsRes.data.data || []);
    } catch (err: any) {
      showMsg('Không thể tải dữ liệu backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateBackup = async () => {
    setActionLoading('create');
    try {
      const res = await api.post('/admin/backup/create-json');
      showMsg(`Sao lưu thành công: ${res.data.fileName}`, 'success');
      fetchData();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Sao lưu thất bại', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (name: string) => {
    try {
      const res = await api.get(`/admin/backup/files/${name}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      showMsg('Tải file thất bại', 'error');
    }
  };

  const handleDelete = async (name: string) => {
    const confirmed = await confirmAction(`Bạn có chắc muốn xóa file "${name}"?`);
    if (!confirmed) return;
    try {
      await api.delete(`/admin/backup/files/${name}`);
      showMsg(`Đã xóa ${name}`, 'success');
      fetchData();
    } catch (err: any) {
      showMsg('Xóa thất bại', 'error');
    }
  };

  const handleRestore = async () => {
    if (!confirmText || !restoreModal) return;
    setActionLoading('restore');
    try {
      const res = await api.post(`/admin/backup/restore/${restoreModal}`, { password: confirmText });
      showMsg(res.data.message || 'Khôi phục thành công', 'success');
      setRestoreModal(null);
      setConfirmText('');
      fetchData();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Khôi phục thất bại', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClean = async () => {
    const confirmed = await confirmAction('Xóa tất cả file backup cũ hơn 10 ngày (giữ tối đa 3 bản)?');
    if (!confirmed) return;
    setActionLoading('clean');
    try {
      const res = await api.post('/admin/backup/clean');
      showMsg(`Đã xóa ${res.data.deleted?.length || 0} file cũ`, 'success');
      fetchData();
    } catch (err: any) {
      showMsg('Dọn dẹp thất bại', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setActionLoading('upload');
    try {
      await api.post('/admin/backup/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showMsg(`Upload thành công: ${file.name}`, 'success');
      fetchData();
    } catch (err: any) {
      showMsg(err.response?.data?.message || 'Upload thất bại', 'error');
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-3">
            <Database className="w-8 h-8" /> Sao lưu & Khôi phục
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tự động backup mỗi ngày lúc 2:00 AM • Xóa tự động sau 10 ngày • Giữ tối đa 3 bản
          </p>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Thao tác nhanh
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading === 'create'}
            className="px-5 py-3 bg-primary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading === 'create' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang sao lưu...</>
            ) : (
              <><Package className="w-5 h-5" /> Sao lưu JSON ngay</>
            )}
          </button>

          <label className="px-5 py-3 bg-primary/80 text-white rounded-xl font-semibold hover:bg-primary transition-all cursor-pointer flex items-center gap-2">
            {actionLoading === 'upload' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang upload...</>
            ) : (
              <><Upload className="w-5 h-5" /> Upload file backup</>
            )}
            <input type="file" accept=".gz,.dump" onChange={handleUpload} className="hidden" />
          </label>

          <button
            onClick={handleClean}
            disabled={actionLoading === 'clean'}
            className="px-5 py-3 bg-accent text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading === 'clean' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang dọn...</>
            ) : (
              <><Trash2 className="w-5 h-5" /> Dọn dẹp file cũ</>
            )}
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" /> Danh sách file backup ({files.length})
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Đang tải...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-400 flex flex-col items-center">
            <Inbox className="w-12 h-12 mb-2 text-gray-300" />
            <p>Chưa có file backup nào. Nhấn "Sao lưu JSON ngay" để tạo bản đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-mobile-table w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Tên file</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Kích thước</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Loại</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Ngày tạo</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td data-label="Tên file" className="py-3 px-4 font-mono text-xs text-gray-700 max-w-[300px] truncate" title={file.name}>
                      {file.name}
                    </td>
                    <td data-label="Kích thước" className="py-3 px-4 text-gray-600">{file.sizeFormatted}</td>
                    <td data-label="Loại" className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        file.type === 'JSON' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {file.type}
                      </span>
                    </td>
                    <td data-label="Ngày tạo" className="py-3 px-4 text-gray-600">{formatDate(file.createdAt)}</td>
                    <td data-label="Thao tác" className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(file.name)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Tải về"
                        ><Download className="w-4 h-4" /></button>
                        <button
                          onClick={() => { setRestoreModal(file.name); setConfirmText(''); }}
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Khôi phục"
                        ><RotateCcw className="w-4 h-4" /></button>
                        <button
                          onClick={() => handleDelete(file.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        ><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Backup Logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" /> Lịch sử Backup / Restore
        </h2>
        {logs.length === 0 ? (
          <div className="text-center py-6 text-gray-400">Chưa có lịch sử</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-mobile-table w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Loại</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Trạng thái</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Ghi chú</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td data-label="Loại" className="py-3 px-4">
                      <span className={`px-2 py-1 flex items-center gap-1 w-max rounded-full text-xs font-semibold ${
                        log.type === 'BACKUP' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {log.type === 'BACKUP' ? <><Package className="w-3 h-3" /> BACKUP</> : <><RotateCcw className="w-3 h-3" /> RESTORE</>}
                      </span>
                    </td>
                    <td data-label="Trạng thái" className="py-3 px-4">
                      <span className={`px-2 py-1 flex items-center gap-1 w-max rounded-full text-xs font-semibold ${
                        log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status === 'SUCCESS' ? <><CheckCircle className="w-3 h-3" /> Thành công</> : <><XCircle className="w-3 h-3" /> Thất bại</>}
                      </span>
                    </td>
                    <td data-label="Ghi chú" className="py-3 px-4 text-gray-600 max-w-[300px] truncate">{log.message || '-'}</td>
                    <td data-label="Thời gian" className="py-3 px-4 text-gray-600">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {restoreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 space-y-5 border border-white/20 relative overflow-hidden transform transition-all scale-100">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-rose-400"></div>
            
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Cảnh báo Khôi phục!</h3>
              <p className="text-sm text-gray-600">
                Thao tác này sẽ <strong className="text-red-600 font-bold">XÓA SẠCH</strong> dữ liệu hiện tại và GHI ĐÈ bằng dữ liệu từ file:
              </p>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 mt-3 break-all relative group">
                <p className="font-mono text-xs text-gray-700 font-medium">{restoreModal}</p>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-sm font-semibold text-gray-700 block mb-2 text-center">
                Vui lòng nhập <strong className="text-red-600">Mật khẩu Admin</strong> của bạn để xác nhận:
              </label>
              <input
                type="password"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-400/20 focus:outline-none text-center font-bold text-lg transition-all placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setRestoreModal(null); setConfirmText(''); }}
                className="flex-1 px-4 py-3.5 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRestore}
                disabled={!confirmText || actionLoading === 'restore'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {actionLoading === 'restore' ? (
                  <><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block"></span> Đang xử lý...</>
                ) : (
                  <><RotateCcw className="w-5 h-5" /> KHÔI PHỤC</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
