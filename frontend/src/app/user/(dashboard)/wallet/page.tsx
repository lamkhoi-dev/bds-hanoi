"use client";
import { useEffect, useState } from 'react';
import { Clock, Plus, ArrowRightLeft, CreditCard, ChevronRight, Activity, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle, Search, Calendar, History, WalletIcon, Ban, Building2, Download } from 'lucide-react';
import api from '@/lib/axios';
import { getAuthToken, isUnauthorizedError } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { formatNumberString } from '@/lib/utils';

export default function Wallet() {
  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [qrData, setQrData] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (qrData) {
      // Bắt đầu polling kiểm tra số dư mỗi 5s
      interval = setInterval(async () => {
        try {
          const profileRes = await api.get('/users/profile');
          if (profileRes.data.balance > balance) {
            // Giao dịch thành công
            toast.success('Nạp tiền thành công!');
            setBalance(profileRes.data.balance);
            setUser(profileRes.data);
            setQrData(null);
            fetchData();
          }
        } catch {}
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrData, balance]);

  const fetchData = async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    try {
      const [profileRes, txRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/users/transactions')
      ]);
      setBalance(profileRes.data.balance || 0);
      setUser(profileRes.data);
      setTransactions(txRes.data || []);
    } catch (err) {
      if (!isUnauthorizedError(err)) console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amount: number) => {
    setSelectedAmount(amount);
    try {
      const res = await api.get(`/payment/qr-code?amount=${amount}`);
      setQrData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể lấy mã QR lúc này. Vui lòng thử lại sau.');
    }
  };

  const handleNotifyAdmin = async () => {
    if (!qrData) return;
    try {
      await api.post('/payment/notify-admin', {
        amount: qrData.amount,
        content: qrData.content
      });
      toast.success(`Hệ thống đang kiểm tra giao dịch của bạn. Nếu sau 10 phút chưa nhận được tiền, vui lòng liên hệ CSKH ${process.env.NEXT_PUBLIC_SUPPORT_PHONE || 'Đang cập nhật'} để được hỗ trợ.`, { duration: 8000 });
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi gửi thông báo. Vui lòng liên hệ CSKH trực tiếp.');
    }
  };

  const handleDownloadQR = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ma-qr-thanh-toan.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed', error);
      toast.error('Không thể tải ảnh lúc này. Vui lòng thử lại sau.');
    }
  };

  const getCardNumber = () => {
    if (!user) return '0000 0000 0000 00';
    
    // Lấy 10 số điện thoại (nếu thiếu thì bù số 0)
    const phone = user.phone ? user.phone.padEnd(10, '0').slice(0, 10) : '0000000000';
    // Lấy 4 ký tự ID
    const id = user.id ? user.id.substring(0, 4).toUpperCase() : '0000';
    
    // Ghép lại thành 14 ký tự
    const raw = phone + id;
    
    // Format dạng: 0948 2381 23AB CD
    return `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 14)}`;
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-textMain">Ví điện tử</h2>
        <div className="h-1 w-12 bg-gradient-to-r from-accent to-accent-light rounded-full mt-2" />
      </div>

      {/* Balance Card - Credit Card Style */}
      <div className="relative bg-gradient-to-br from-primary-dark via-primary to-primary-light rounded-3xl p-8 shadow-glass-lg mb-10 overflow-hidden max-w-lg">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/10 rounded-full" />
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-sm font-medium">Số dư hiện tại</p>
              <p className="text-white/40 text-xs uppercase">{user?.fullName || user?.name || 'NHÀ ĐẤT WALLET'}</p>
            </div>
          </div>
          <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {loading ? (
              <span className="inline-block w-48 h-10 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              `${formatNumberString(balance * 1000)} ₫`
            )}
          </p>
          <div className="flex items-center gap-4 mt-6 text-white/40 text-xs tracking-widest font-mono">
            <span>{getCardNumber()}</span>
            <span>MEMBER CARD</span>
          </div>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="bg-white rounded-2xl shadow-card border border-borderLight/50 p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-textMain mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nạp tiền tự động
          </h3>
          <p className="text-sm text-textSecondary mb-6">Hệ thống xử lý giao dịch hoàn toàn tự động 24/7</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[10000, 20000, 50000, 100000, 150000, 200000, 500000].map((amount) => (
              <button
                key={amount}
                onClick={() => handleDeposit(amount)}
                className={`group relative bg-gradient-to-b border-2 text-primary font-bold py-4 px-3 rounded-xl transition-all duration-300 active:scale-95 ${
                  selectedAmount === amount ? 'border-primary from-primary/5 to-primary/10 shadow-card-hover' : 'from-white to-background border-borderLight hover:border-primary/50'
                }`}
              >
                <span className="text-xs text-textSecondary block mb-1">VND</span>
                <span className="text-lg">{formatNumberString(amount)}</span>
              </button>
            ))}
          </div>
        </div>

        {qrData && (
          <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 flex flex-col items-center justify-center animate-fade-in">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <img src={qrData.qrUrl} alt="QR Code" className="w-64 h-64 object-contain" />
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">
              Mở ứng dụng ngân hàng và <strong className="text-primary">Quét mã QR</strong><br />
              Hệ thống tự động cộng tiền trong 3-5s
            </p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => handleDownloadQR(qrData.qrUrl)}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Download size={16} /> Lưu mã QR
              </button>
              <button 
                onClick={handleNotifyAdmin}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-sm"
              >
                Tôi đã chuyển khoản
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History Placeholder */}
      <div className="bg-white rounded-2xl shadow-card border border-borderLight/50 p-6 md:p-8">
        <h3 className="text-lg font-bold text-textMain mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Lịch sử giao dịch
        </h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-background-alt rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-textSecondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-textSecondary text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background-alt/50 border-b border-borderLight/30">
                  <th className="py-3 px-4 text-xs font-bold text-textSecondary uppercase">Mã GD</th>
                  <th className="py-3 px-4 text-xs font-bold text-textSecondary uppercase">Thời gian</th>
                  <th className="py-3 px-4 text-xs font-bold text-textSecondary uppercase">Nội dung</th>
                  <th className="py-3 px-4 text-xs font-bold text-textSecondary uppercase text-right">Số tiền</th>
                  <th className="py-3 px-4 text-xs font-bold text-textSecondary uppercase text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-borderLight/30 hover:bg-primary/[0.02] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-textMain">
                      {tx.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-sm text-textSecondary">
                      {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-sm text-textMain">{tx.description}</td>
                    <td className={`py-3 px-4 text-sm font-bold text-right ${['DEPOSIT', 'ADMIN_ADJUST', 'REFUND'].includes(tx.type) ? 'text-emerald-500' : 'text-red-500'}`}>
                      {['DEPOSIT', 'ADMIN_ADJUST', 'REFUND'].includes(tx.type) ? '+' : '-'}{formatNumberString(tx.amount * 1000)} ₫
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                        tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                        tx.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
