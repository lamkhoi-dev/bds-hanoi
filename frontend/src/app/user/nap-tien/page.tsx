"use client";

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DepositPage() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number>(10000); // Default 10k
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);

  const handleMockPayment = async () => {
    try {
      setMockLoading(true);
      const mockPayload = {
        id: Date.now(),
        transferAmount: amount,
        content: qrData?.content || 'NAP',
        transferType: 'in'
      };
      await api.post('/payment/webhook/sepay/mock', mockPayload);
      toast.success('Nạp tiền giả lập thành công!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi nạp tiền giả lập');
    } finally {
      setMockLoading(false);
    }
  };

  const fetchQr = useCallback(async (val: number) => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/payment/qr-code?amount=${val}`);
      setQrData(res.data);
    } catch (error) {
      if (!isUnauthorizedError(error)) console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownloadQR = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ma-qr-nap-tien.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed', error);
      toast.error('Không thể tải ảnh lúc này. Vui lòng thử lại sau.');
    }
  };

  useEffect(() => {
    fetchQr(amount);
  }, [amount, fetchQr]);

  const handleAmountChange = (e: any) => {
    const val = Number(e.target.value);
    setAmount(val);
  };

  const copyContentToClipboard = () => {
    const content = qrData?.content || `napid ${user?.id || 'TEST'}`;
    navigator.clipboard.writeText(content);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const copyAccountToClipboard = () => {
    const account = qrData?.bankAccount || '0987654321';
    navigator.clipboard.writeText(account);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handlePaid = async () => {
    try {
      setMockLoading(true);
      await api.post('/payment/notify-admin', {
        amount,
        content: qrData?.content || `napid ${user?.id}`
      });
      toast.success('Đã thông báo cho Admin! Hệ thống đang xử lý giao dịch, vui lòng chờ trong giây lát.');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thông báo cho Admin.');
    } finally {
      setMockLoading(false);
    }
  };

  if (loading && !qrData) return <div className="p-8 text-center">Đang tải cấu hình thanh toán...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Nạp điểm vào tài khoản</h1>
      
      <div className="bg-white rounded-2xl shadow-card p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        
        {/* Left: Info & Manual Transfer */}
        <div>
          <h2 className="font-bold text-lg mb-4 text-primary">Thông tin chuyển khoản</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Ngân hàng</label>
              <div className="font-semibold">{qrData?.bankBin || 'Chưa cấu hình'}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 block mb-1">Chủ tài khoản</label>
              <div className="font-semibold uppercase">{qrData?.accountName || 'Chưa cấu hình'}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 block mb-1">Số tài khoản</label>
              <div className="flex items-center gap-2">
                <div className="font-bold text-lg text-textMain">{qrData?.bankAccount || '0987654321'}</div>
                <button 
                  onClick={copyAccountToClipboard}
                  className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-1 transition-colors"
                >
                  <Copy size={14} /> {copiedAccount ? 'Đã copy' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-1">Số tiền muốn nạp (VNĐ)</label>
              <select 
                value={amount} 
                onChange={handleAmountChange}
                className="font-sans w-full p-3 border border-borderLight rounded-xl outline-none focus:border-primary cursor-pointer"
              >
                <option className="font-sans" value={10000}>10,000 đ (10 điểm)</option>
                <option className="font-sans" value={50000}>50,000 đ (50 điểm)</option>
                <option className="font-sans" value={100000}>100,000 đ (100 điểm)</option>
                <option className="font-sans" value={200000}>200,000 đ (200 điểm)</option>
                <option className="font-sans" value={500000}>500,000 đ (500 điểm)</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <label className="text-sm text-blue-600 block mb-2 font-semibold">Nội dung chuyển khoản (BẮT BUỘC)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-200 text-lg font-mono text-center font-bold text-primary">
                  {qrData?.content || `napid ${user?.id || 'TEST'}`}
                </code>
                <button 
                  onClick={copyContentToClipboard}
                  className="px-4 py-2 bg-primary text-white rounded font-bold hover:bg-primary-dark transition-colors flex items-center gap-1"
                >
                  <Copy size={16} /> {copiedContent ? 'Đã copy' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-red-500 mt-2 italic">*Lưu ý: Bạn phải ghi chính xác nội dung chuyển khoản để hệ thống tự động cộng điểm. Điểm sẽ được cộng trong vòng 1-3 phút.</p>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <button
                  onClick={handlePaid}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-3"
                >
                  Tôi đã thanh toán
                </button>

                <button
                  onClick={handleMockPayment}
                  disabled={mockLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mockLoading ? 'Đang xử lý...' : 'Thanh toán giả lập (Demo UI)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: QR Code */}
        <div className="flex flex-col items-center justify-center border-l-0 md:border-l border-borderLight/50 pl-0 md:pl-8 pt-8 md:pt-0">
          <h2 className="font-bold text-lg mb-4 text-center">Quét mã QR để nạp nhanh</h2>
          {loading ? (
            <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">Đang tạo mã...</div>
          ) : (
            <div className="flex flex-col items-center">
              <img width={256} height={256} 
                src={qrData?.qrUrl || `https://img.vietqr.io/image/970436-0987654321-compact.png?amount=${amount}&addInfo=napid%20${user?.id || 'TEST'}&accountName=CONG%20TY%20BDS`} 
                alt="QR Code" 
                className="w-64 h-64 rounded-2xl border p-2 shadow-sm mb-4" 
              />
              <button 
                onClick={() => handleDownloadQR(qrData?.qrUrl || `https://img.vietqr.io/image/970436-0987654321-compact.png?amount=${amount}&addInfo=napid%20${user?.id || 'TEST'}&accountName=CONG%20TY%20BDS`)}
                className="px-6 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2 w-full max-w-[256px]"
              >
                <Download size={18} /> Lưu mã QR về máy
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4 text-center">
            Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã. Số tiền và nội dung sẽ được điền tự động.
          </p>
        </div>

      </div>
    </div>
  );
}
