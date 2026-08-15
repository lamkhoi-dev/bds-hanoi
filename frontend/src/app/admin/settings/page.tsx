"use client";

import React, { useState, useEffect } from 'react';
import { Save, Shield, CreditCard, Search, Map, CheckCircle2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingMeilisearch, setSyncingMeilisearch] = useState(false);
  const [showSepayToken, setShowSepayToken] = useState(false);
  useAuth();
  
  const [settings, setSettings] = useState({
    sepayWebhookToken: '',
    googleSearchConsoleId: '',
    googleMapsApiKey: '',
    googleAdsenseClientId: '',
    googleAdsenseSlotId: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    bankBin: '',
    bankAccount: '',
    accountName: '',
    vipPrice: 0,
    upPrice: 0,
    vipDurationDays: 4,
    upDurationDays: 3,
    freePostsPerUser: 3,
    isPreModerationEnabled: true,
    freePostsPerDay: 3,
    freeUpsPerDay: 1,
    maxPostsPerDay: 50,
    maxUpsPerDay: 50,
    maxUpPerPostPerDay: 10,
    upCooldownMinutes: 10,
    propertyAdUrl: '',
    propertyAdLink: '',
    propertyAds: [] as Array<{url: string; link: string}>,
    isPropertyAdActive: true,
    showOnlineUsers: true,
    maxTotalPostsPerUser: 10,
    extraPostPrice: 5000
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      const data = res.data;
      setSettings({
        sepayWebhookToken: data.sepayWebhookToken || '',
        googleSearchConsoleId: data.googleSearchConsoleId || '',
        googleMapsApiKey: data.googleMapsApiKey || '',
        googleAdsenseClientId: data.googleAdsenseClientId || '',
        googleAdsenseSlotId: data.googleAdsenseSlotId || '',
        googleAnalyticsId: data.googleAnalyticsId || '',
        facebookPixelId: data.facebookPixelId || '',
        bankBin: data.bankBin || '',
        bankAccount: data.bankAccount || '',
        accountName: data.accountName || '',
        vipPrice: data.vipPrice || 0,
        upPrice: data.upPrice || 0,
        vipDurationDays: data.vipDurationDays || 4,
        upDurationDays: data.upDurationDays || 3,
        freePostsPerUser: data.freePostsPerUser || 3,
        isPreModerationEnabled: data.isPreModerationEnabled ?? true,
        freePostsPerDay: data.freePostsPerDay ?? 3,
        freeUpsPerDay: data.freeUpsPerUserPerDay ?? 1,
        maxPostsPerDay: data.maxPostsPerDay ?? 50,
        maxUpsPerDay: data.maxUpsPerDay ?? 50,
        maxUpPerPostPerDay: data.maxUpPerPostPerDay ?? 10,
        upCooldownMinutes: data.upCooldownMinutes ?? 10,
        propertyAdUrl: data.propertyAdUrl || '',
        propertyAdLink: data.propertyAdLink || '',
        propertyAds: data.propertyAds || [],
        isPropertyAdActive: data.isPropertyAdActive ?? true,
        showOnlineUsers: data.showOnlineUsers ?? true,
        maxTotalPostsPerUser: data.maxTotalPostsPerUser ?? 10,
        extraPostPrice: data.extraPostPrice ?? 5000
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Cập nhật cài đặt thành công!');
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncMeilisearch = async () => {
    if (!window.confirm('Quá trình đồng bộ có thể mất vài phút nếu dữ liệu lớn. Bạn có chắc chắn muốn chạy đồng bộ Meilisearch ngay bây giờ?')) return;
    setSyncingMeilisearch(true);
    try {
      const res = await api.post('/admin/sync-meilisearch');
      toast.success(`Đồng bộ thành công ${res.data.synced || 0} bất động sản lên Meilisearch!`);
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi đồng bộ Meilisearch');
    } finally {
      setSyncingMeilisearch(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải cấu hình...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-4 lg:p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Cài đặt Hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình API Keys và Tham số toàn cục</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={handleSyncMeilisearch}
            disabled={syncingMeilisearch}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={syncingMeilisearch ? "animate-spin" : ""} />
            {syncingMeilisearch ? 'Đang đồng bộ...' : 'Đồng bộ Meilisearch'}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
          {/* Third-Party API Keys */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="text-blue-600" size={20} />
              Cấu hình API Keys (Third-party)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">SePay Webhook Token</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type={showSepayToken ? "text" : "password"} 
                    value={settings.sepayWebhookToken} 
                    onChange={e => setSettings({...settings, sepayWebhookToken: e.target.value})}
                    placeholder="Nhập API Key của SePay..."
                    className="w-full pl-10 pr-10 p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowSepayToken(!showSepayToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showSepayToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Dùng để xác thực callback từ SePay khi có biến động số dư.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Adsense Client ID</label>
                <input 
                  type="text" 
                  value={settings.googleAdsenseClientId} 
                  onChange={e => setSettings({...settings, googleAdsenseClientId: e.target.value})}
                  placeholder="VD: ca-pub-xxxxxxxxxxxxxxxx"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Adsense Slot ID</label>
                <input 
                  type="text" 
                  value={settings.googleAdsenseSlotId} 
                  onChange={e => setSettings({...settings, googleAdsenseSlotId: e.target.value})}
                  placeholder="VD: xxxxxxxxx"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Search Console ID</label>
                <input 
                  type="text" 
                  value={settings.googleSearchConsoleId} 
                  onChange={e => setSettings({...settings, googleSearchConsoleId: e.target.value})}
                  placeholder="VD: GvaX-hE_FGpP..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID (Mã đo lường)</label>
                <input 
                  type="text" 
                  value={settings.googleAnalyticsId} 
                  onChange={e => setSettings({...settings, googleAnalyticsId: e.target.value})}
                  placeholder="VD: G-XXXXXXXXXX"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>


            </div>
          </div>

          {/* Bank Info */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="text-green-600" size={20} />
              Thông tin Ngân hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Ngân hàng (Mã BIN)</label>
                <input 
                  type="text" 
                  value={settings.bankBin} 
                  onChange={e => setSettings({...settings, bankBin: e.target.value})}
                  placeholder="VD: VCB, BIDV, 970436..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số Tài khoản</label>
                <input 
                  type="text" 
                  value={settings.bankAccount} 
                  onChange={e => setSettings({...settings, bankAccount: e.target.value})}
                  placeholder="Nhập số tài khoản..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Chủ Tài khoản</label>
                <input 
                  type="text" 
                  value={settings.accountName} 
                  onChange={e => setSettings({...settings, accountName: e.target.value})}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase"
                />
              </div>
            </div>
          </div>

          {/* Configuration Settings */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Cấu hình Hiển thị & Kiểm duyệt
              </h3>
              <div className="space-y-5">
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer border border-gray-200 hover:border-primary transition-colors">
                  <input 
                    type="checkbox" 
                    checked={settings.showOnlineUsers} 
                    onChange={e => setSettings({...settings, showOnlineUsers: e.target.checked})} 
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary" 
                  />
                  <div>
                    <div className="font-medium text-gray-800">Hiển thị số người đang online</div>
                    <div className="text-sm text-gray-500">Hiển thị trên bảng điều khiển Admin và Trang chủ</div>
                  </div>
                </label>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="preMod" checked={settings.isPreModerationEnabled} onChange={e => setSettings({...settings, isPreModerationEnabled: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                  <label htmlFor="preMod" className="font-medium text-gray-800">Bật kiểm duyệt trước khi đăng</label>
                </div>
              </div>
          </div>

          {/* Pricing & Limits */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="text-primary" size={20} />
              Cấu hình Bảng giá & Giới hạn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá VIP (1 ngày) (VNĐ)</label>
                <input type="number" value={settings.vipPrice} onChange={e => setSettings({...settings, vipPrice: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá Đẩy UP (VNĐ)</label>
                <input type="number" value={settings.upPrice} onChange={e => setSettings({...settings, upPrice: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn UP (Ngày)</label>
                <input type="number" value={settings.upDurationDays} onChange={e => setSettings({...settings, upDurationDays: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              {/* Removed unused freePostsPerUser */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tin miễn phí / Ngày</label>
                <input type="number" value={settings.freePostsPerDay} onChange={e => setSettings({...settings, freePostsPerDay: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượt UP miễn phí / Ngày</label>
                <input type="number" value={settings.freeUpsPerDay} onChange={e => setSettings({...settings, freeUpsPerDay: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tối đa số tin đăng (Tổng)</label>
                <input type="number" value={settings.maxTotalPostsPerUser} onChange={e => setSettings({...settings, maxTotalPostsPerUser: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tối đa số tin đăng / Ngày</label>
                <input type="number" value={settings.maxPostsPerDay} onChange={e => setSettings({...settings, maxPostsPerDay: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tối đa số lượt UP / Ngày</label>
                <input type="number" value={settings.maxUpsPerDay} onChange={e => setSettings({...settings, maxUpsPerDay: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tối đa UP / Ngày cho MỖI TIN</label>
                <input type="number" value={settings.maxUpPerPostPerDay} onChange={e => setSettings({...settings, maxUpPerPostPerDay: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian chờ UP tin (Phút)</label>
                <input type="number" value={settings.upCooldownMinutes} onChange={e => setSettings({...settings, upCooldownMinutes: Number(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" id="preMod" checked={settings.isPreModerationEnabled} onChange={e => setSettings({...settings, isPreModerationEnabled: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                <label htmlFor="preMod" className="font-medium text-gray-800">Bật kiểm duyệt trước khi đăng</label>
              </div>
            </div>
          </div>

          {/* Advertisement Settings */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Map className="text-primary" size={20} />
              Quảng cáo trang chi tiết BĐS
            </h2>
            <div className="flex flex-col gap-6 mt-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="adActive" 
                  checked={settings.isPropertyAdActive} 
                  onChange={e => setSettings({...settings, isPropertyAdActive: e.target.checked})} 
                  className="w-5 h-5 rounded text-primary focus:ring-primary" 
                />
                <label htmlFor="adActive" className="font-medium text-gray-800">Hiển thị quảng cáo</label>
              </div>

              {settings.propertyAds.map((ad, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative">
                  <div className="absolute top-2 right-2">
                    <button 
                      type="button"
                      onClick={() => {
                        const newAds = [...settings.propertyAds];
                        newAds.splice(idx, 1);
                        setSettings({...settings, propertyAds: newAds});
                      }}
                      className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-md"
                      title="Xóa quảng cáo này"
                    >
                      Xóa
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-700 mb-3">Quảng cáo #{idx + 1}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn URL Hình ảnh/Video/Youtube</label>
                      <input 
                        type="text" 
                        value={ad.url} 
                        onChange={e => {
                          const newAds = [...settings.propertyAds];
                          newAds[idx] = { ...newAds[idx], url: e.target.value };
                          setSettings({...settings, propertyAds: newAds});
                        }} 
                        placeholder="https://example.com/banner.jpg"
                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link đích khi click vào quảng cáo</label>
                      <input 
                        type="text" 
                        value={ad.link} 
                        onChange={e => {
                          const newAds = [...settings.propertyAds];
                          newAds[idx] = { ...newAds[idx], link: e.target.value };
                          setSettings({...settings, propertyAds: newAds});
                        }} 
                        placeholder="https://example.com"
                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                      />
                    </div>
                  </div>
                </div>
              ))}

              {settings.propertyAds.length < 5 && (
                <button 
                  type="button"
                  onClick={() => setSettings({...settings, propertyAds: [...settings.propertyAds, {url: '', link: ''}]})}
                  className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-primary hover:border-primary transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span className="text-xl">+</span> Thêm quảng cáo ({settings.propertyAds.length}/5)
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button disabled={saving} type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-primary/30 flex items-center gap-2">
              <Save size={20} />
              {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
