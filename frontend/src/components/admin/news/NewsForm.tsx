"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Image as ImageIcon, Plus, X, ExternalLink } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImageWithMeta } from '@/lib/upload';
import { getApiErrorMessage } from '@/lib/api-error';
import { checkFeaturedImageSize } from '@/lib/news/image-size';
import { newsTitle, newsDescription, newsCanonicalPath, isSelfCanonical } from '@/lib/news/seo';
import { siteConfig } from '@/lib/site-config';

const field = 'w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm';
const label = 'block text-sm font-semibold text-gray-700 mb-1.5';

// TipTap chỉ cần cho trang quản trị — tải kiểu `dynamic`/`ssr:false` để không dựng editor
// phía máy chủ (tránh mọi rủi ro lệch hydrate ngoài dự phòng `immediatelyRender: false` đã
// có sẵn trong NewsEditor) và tách bundle khỏi các trang khác.
const NewsEditor = dynamic(() => import('@/components/news-editor/NewsEditor'), {
  ssr: false,
  loading: () => <div className="min-h-[400px] border border-gray-300 rounded-lg bg-gray-50 animate-pulse" />,
});

interface NewsSource {
  title: string;
  url: string;
}

export interface NewsFormValue {
  title: string;
  sapo: string;
  content: string;
  thumbnail: string;
  thumbnailAlt: string;
  thumbnailCaption: string;
  thumbnailCredit: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  publishedAt: string; // "" hoặc chuỗi datetime-local
  authorName: string;
  categoryId: string; // "" = không chuyên mục
  sources: NewsSource[];
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  relatedPropertyIds: string[];
}

const EMPTY: NewsFormValue = {
  title: '', sapo: '', content: '', thumbnail: '', thumbnailAlt: '', thumbnailCaption: '', thumbnailCredit: '',
  status: 'PUBLISHED', publishedAt: '', authorName: '', categoryId: '', sources: [],
  seoTitle: '', metaDescription: '', canonicalUrl: '', relatedPropertyIds: [],
};

/** ISO -> giá trị `datetime-local` (giờ Việt Nam) và chiều ngược lại. */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // `datetime-local` cần giờ theo múi giờ NGƯỜI DÙNG ĐANG XEM (trình duyệt tự quy đổi hộ
  // khi hiển thị) — lấy các thành phần theo giờ ĐỊA PHƯƠNG của trình duyệt là đúng ở đây,
  // khác với `formatNewsDateTime` (luôn ép giờ Việt Nam cho HIỂN THỊ công khai).
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function newsRecordToFormValue(news: any): NewsFormValue {
  return {
    title: news?.title ?? '',
    sapo: news?.sapo ?? '',
    content: news?.content ?? '',
    thumbnail: news?.thumbnail ?? '',
    thumbnailAlt: news?.thumbnailAlt ?? '',
    thumbnailCaption: news?.thumbnailCaption ?? '',
    thumbnailCredit: news?.thumbnailCredit ?? '',
    thumbnailWidth: news?.thumbnailWidth ?? undefined,
    thumbnailHeight: news?.thumbnailHeight ?? undefined,
    status: news?.status ?? 'PUBLISHED',
    publishedAt: isoToLocalInput(news?.publishedAt),
    authorName: news?.authorName ?? '',
    categoryId: news?.categoryId ?? '',
    sources: Array.isArray(news?.sources) ? news.sources : [],
    seoTitle: news?.seoTitle ?? '',
    metaDescription: news?.metaDescription ?? '',
    canonicalUrl: news?.canonicalUrl ?? '',
    relatedPropertyIds: Array.isArray(news?.relatedPropertyIds) ? news.relatedPropertyIds : [],
  };
}

/** Chuyển state form -> payload gửi API. `minorEdit` do trang gọi tự thêm (chỉ có ở sửa bài). */
export function newsFormValueToPayload(v: NewsFormValue) {
  return {
    title: v.title.trim(),
    sapo: v.sapo.trim() || undefined,
    content: v.content,
    thumbnail: v.thumbnail || undefined,
    thumbnailAlt: v.thumbnailAlt.trim() || undefined,
    thumbnailCaption: v.thumbnailCaption.trim() || undefined,
    thumbnailCredit: v.thumbnailCredit.trim() || undefined,
    thumbnailWidth: v.thumbnailWidth,
    thumbnailHeight: v.thumbnailHeight,
    status: v.status,
    publishedAt: localInputToIso(v.publishedAt),
    authorName: v.authorName.trim() || undefined,
    categoryId: v.categoryId || '',
    sources: v.sources.filter((s) => s.title.trim() && s.url.trim()),
    seoTitle: v.seoTitle.trim() || undefined,
    metaDescription: v.metaDescription.trim() || undefined,
    canonicalUrl: v.canonicalUrl.trim() || undefined,
    relatedPropertyIds: v.relatedPropertyIds,
  };
}

export default function NewsForm({
  mode,
  initial,
  onSubmit,
  submitting,
}: {
  mode: 'create' | 'edit';
  initial?: any;
  onSubmit: (payload: any) => void | Promise<void>;
  submitting: boolean;
}) {
  const { user } = useAuth();
  const [v, setV] = useState<NewsFormValue>(() => (initial ? newsRecordToFormValue(initial) : EMPTY));
  const set = <K extends keyof NewsFormValue>(key: K, value: NewsFormValue[K]) => setV((prev) => ({ ...prev, [key]: value }));

  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [minorEdit, setMinorEdit] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [relatedInput, setRelatedInput] = useState('');
  const [relatedResolved, setRelatedResolved] = useState<Record<string, { title: string; status: string; isRemoved: boolean }>>({});
  const [resolvingRelated, setResolvingRelated] = useState(false);

  // Tác giả điền sẵn tên người đang đăng nhập — CHỈ khi tạo mới, không ghi đè khi sửa bài
  // của người khác.
  useEffect(() => {
    if (mode === 'create' && !v.authorName && user?.name) set('authorName', user.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user?.name]);

  useEffect(() => {
    // Dùng danh sách ADMIN (kể cả chuyên mục đã tắt) — nếu chỉ lấy danh sách công khai, một
    // bài đang gán chuyên mục vừa bị tắt sẽ không có trong <select>, khiến trình duyệt hiện
    // trống và âm thầm đổi categoryId khi lưu lại.
    api.get('/news-categories/admin/all').then((res) => setCategories(res.data || [])).catch(() => undefined);
  }, []);

  // Nạp sẵn tiêu đề các BĐS liên quan đã lưu (khi mở lại bài để sửa) — không thì chip chỉ
  // hiện mã, admin không nhận ra đó là tin nào.
  useEffect(() => {
    if (!initial?.relatedPropertyIds?.length) return;
    api
      .post('/news/admin/resolve-properties', { refs: initial.relatedPropertyIds })
      .then((res) => {
        const map: Record<string, any> = {};
        for (const f of res.data?.found ?? []) map[f.id] = { title: f.title, status: f.status, isRemoved: f.isRemoved };
        setRelatedResolved((prev) => ({ ...prev, ...map }));
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingThumb(true);
    try {
      const { url, width, height } = await uploadImageWithMeta(file);
      setV((prev) => ({ ...prev, thumbnail: url, thumbnailWidth: width, thumbnailHeight: height }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tải ảnh lên'));
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const sizeCheck = useMemo(() => checkFeaturedImageSize(v.thumbnailWidth, v.thumbnailHeight), [v.thumbnailWidth, v.thumbnailHeight]);

  const resolveRelated = async () => {
    if (!relatedInput.trim()) return;
    setResolvingRelated(true);
    try {
      const res = await api.post('/news/admin/resolve-properties', { refs: relatedInput.split(/\r?\n/) });
      const found: any[] = res.data?.found ?? [];
      const notFound: string[] = res.data?.notFound ?? [];
      if (found.length) {
        setV((prev) => ({ ...prev, relatedPropertyIds: Array.from(new Set([...prev.relatedPropertyIds, ...found.map((f) => f.id)])) }));
        setRelatedResolved((prev) => {
          const next = { ...prev };
          for (const f of found) next[f.id] = { title: f.title, status: f.status, isRemoved: f.isRemoved };
          return next;
        });
        setRelatedInput('');
      }
      if (notFound.length) toast.error(`Không tìm thấy ${notFound.length} tin: ${notFound.join(', ')}`);
      if (!found.length && !notFound.length) toast.error('Chưa nhận ra link/mã tin nào trong ô vừa dán.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tra được danh sách tin liên quan'));
    } finally {
      setResolvingRelated(false);
    }
  };

  const removeRelated = (id: string) => set('relatedPropertyIds', v.relatedPropertyIds.filter((x) => x !== id));

  const addSource = () => set('sources', [...v.sources, { title: '', url: '' }]);
  const updateSource = (i: number, patch: Partial<NewsSource>) =>
    set('sources', v.sources.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSource = (i: number) => set('sources', v.sources.filter((_, idx) => idx !== i));

  const validate = (): string | null => {
    if (!v.title.trim()) return 'Vui lòng nhập tiêu đề';
    if (!v.content.trim()) return 'Vui lòng nhập nội dung';
    if (v.thumbnail && !v.thumbnailAlt.trim() && v.status === 'PUBLISHED') {
      return 'Ảnh đại diện cần có mô tả (alt) trước khi xuất bản — tốt cho SEO và người dùng khiếm thị.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const payload = newsFormValueToPayload(v);
    if (mode === 'edit') (payload as any).minorEdit = minorEdit;
    await onSubmit(payload);
  };

  const previewTitle = newsTitle({ seoTitle: v.seoTitle, title: v.title || 'Tiêu đề bài viết' });
  const previewDescription = newsDescription({ metaDescription: v.metaDescription, sapo: v.sapo, content: v.content });
  const previewPath = newsCanonicalPath({ canonicalUrl: v.canonicalUrl, slug: initial?.slug || 'duong-dan-bai-viet' });
  const canonicalIsForeign = v.canonicalUrl.trim() && !isSelfCanonical({ canonicalUrl: v.canonicalUrl, slug: initial?.slug || '' });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      {/* --- Tiêu đề + sapo --- */}
      <div className="space-y-2">
        <label className={label}>Tiêu đề bài viết <span className="text-red-500">*</span></label>
        <input required value={v.title} onChange={(e) => set('title', e.target.value)} className={field} placeholder="Nhập tiêu đề..." />
      </div>
      <div className="space-y-2">
        <label className={label}>
          Sa-pô <span className="font-normal text-gray-400">— đoạn dẫn ngắn hiện dưới tiêu đề ({v.sapo.length}/300)</span>
        </label>
        <textarea
          value={v.sapo}
          onChange={(e) => set('sapo', e.target.value.slice(0, 300))}
          className={`${field} h-20 resize-none`}
          placeholder="Tóm tắt 1-2 câu nội dung chính của bài..."
        />
      </div>

      {/* --- Ảnh đại diện --- */}
      <div className="space-y-2">
        <label className={label}>Ảnh đại diện</label>
        <div className="flex items-start gap-4">
          <div className="relative w-40 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
            {v.thumbnail ? <Image src={v.thumbnail} alt="Thumbnail" fill className="object-cover" /> : <ImageIcon className="text-gray-400" size={28} />}
          </div>
          <div className="flex-1 space-y-2">
            <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
              {isUploadingThumb ? 'Đang tải lên...' : 'Chọn ảnh'}
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploadingThumb} />
            </label>
            <p className="text-xs text-gray-500">Khuyến nghị tối thiểu 1200×675px (16:9). Tối đa 5MB.</p>
            {!sizeCheck.ok && sizeCheck.message && <p className="text-xs text-amber-600 font-medium">⚠ {sizeCheck.message}</p>}
            {v.thumbnail && (
              <>
                <input value={v.thumbnailAlt} onChange={(e) => set('thumbnailAlt', e.target.value)} className={`${field} !py-1.5 text-xs`} placeholder="Mô tả ảnh (alt) — bắt buộc khi xuất bản" />
                <input value={v.thumbnailCaption} onChange={(e) => set('thumbnailCaption', e.target.value)} className={`${field} !py-1.5 text-xs`} placeholder="Chú thích ảnh (không bắt buộc)" />
                <input value={v.thumbnailCredit} onChange={(e) => set('thumbnailCredit', e.target.value)} className={`${field} !py-1.5 text-xs`} placeholder="Nguồn ảnh (không bắt buộc)" />
                <button type="button" onClick={() => setV((p) => ({ ...p, thumbnail: '', thumbnailWidth: undefined, thumbnailHeight: undefined }))} className="text-red-500 text-xs font-medium">
                  Xoá ảnh
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- Nội dung --- */}
      <div className="space-y-2">
        <label className={label}>Nội dung <span className="text-red-500">*</span></label>
        <NewsEditor value={v.content} onChange={(html) => set('content', html)} className="min-h-[400px]" />
      </div>

      {/* --- Xuất bản --- */}
      <div className="space-y-3 border border-gray-200 rounded-xl p-4">
        <label className={label}>Xuất bản</label>
        <div className="flex flex-wrap gap-4">
          {([
            ['DRAFT', 'Nháp'],
            ['PUBLISHED', 'Xuất bản'],
            ['HIDDEN', 'Ẩn'],
          ] as const).map(([val, text]) => (
            <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="status" checked={v.status === val} onChange={() => set('status', val)} />
              {text}
            </label>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Ngày giờ đăng {v.publishedAt && new Date(v.publishedAt).getTime() > Date.now() && <span className="text-amber-600">(Hẹn giờ)</span>}
          </label>
          <input type="datetime-local" value={v.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} className={`${field} max-w-xs`} />
          <p className="text-xs text-gray-400 mt-1">Để trống = đăng ngay bây giờ. Chọn giờ tương lai = hẹn giờ đăng tự động.</p>
        </div>
        {mode === 'edit' && (
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={minorEdit} onChange={(e) => setMinorEdit(e.target.checked)} />
            Chỉ sửa lỗi nhỏ (không cập nhật &quot;ngày cập nhật&quot; công khai của bài)
          </label>
        )}
      </div>

      {/* --- Chuyên mục + tác giả --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>
            Chuyên mục{' '}
            <a href="/admin/news/categories" target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-normal hover:underline inline-flex items-center gap-0.5">
              Quản lý <ExternalLink size={11} />
            </a>
          </label>
          <select value={v.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={field}>
            <option value="">— Không chuyên mục —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Tác giả</label>
          <input value={v.authorName} onChange={(e) => set('authorName', e.target.value)} className={field} placeholder="Tên tác giả hiển thị công khai" />
        </div>
      </div>

      {/* --- Nguồn tham khảo --- */}
      <div className="space-y-2">
        <label className={label}>Nguồn tham khảo</label>
        {v.sources.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input value={s.title} onChange={(e) => updateSource(i, { title: e.target.value })} className={`${field} flex-1`} placeholder="Tên nguồn" />
            <input value={s.url} onChange={(e) => updateSource(i, { url: e.target.value })} className={`${field} flex-1`} placeholder="https://..." />
            <button type="button" onClick={() => removeSource(i)} className="px-3 text-gray-400 hover:text-red-600"><X size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={addSource} className="text-sm text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
          <Plus size={14} /> Thêm nguồn
        </button>
      </div>

      {/* --- BĐS liên quan --- */}
      <div className="space-y-2">
        <label className={label}>BĐS liên quan <span className="font-normal text-gray-400">— dán link hoặc mã tin, mỗi dòng một tin. Để trống = tự động lấy tin nổi bật mới nhất.</span></label>
        <div className="flex gap-2">
          <textarea value={relatedInput} onChange={(e) => setRelatedInput(e.target.value)} className={`${field} h-20 resize-none flex-1`} placeholder={'https://.../tin/ten-tin-ab12c\nhoặc chỉ cần mã: ab12c'} />
          <button type="button" disabled={resolvingRelated} onClick={resolveRelated} className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 self-start">
            {resolvingRelated ? 'Đang tra...' : 'Tra cứu'}
          </button>
        </div>
        {v.relatedPropertyIds.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {v.relatedPropertyIds.map((id) => {
              const info = relatedResolved[id];
              return (
                <span key={id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${info?.isRemoved ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                  {info?.title || id}
                  {info?.isRemoved && ' (tin đã bị xoá)'}
                  <button type="button" onClick={() => removeRelated(id)} className="hover:text-red-600"><X size={12} /></button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* --- SEO (thu gọn) --- */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button type="button" onClick={() => setSeoOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left">
          <span className="text-sm font-semibold text-gray-700">SEO (tuỳ chọn)</span>
          <span className="text-gray-400 text-xs">{seoOpen ? 'Thu gọn ▲' : 'Mở rộng ▼'}</span>
        </button>
        {seoOpen && (
          <div className="p-4 space-y-4">
            <div className="rounded-lg border border-gray-100 p-3 bg-white">
              <p className="text-xs text-gray-400 mb-1">Xem trước trên Google</p>
              <p className="text-[#1a0dab] text-base leading-tight truncate">{previewTitle}</p>
              <p className="text-[#006621] text-xs">{siteConfig.url}{previewPath}</p>
              <p className="text-gray-600 text-sm line-clamp-2">{previewDescription}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">SEO title ({v.seoTitle.length}/60 khuyến nghị)</label>
              <input value={v.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} className={field} placeholder={v.title || 'Để trống = dùng tiêu đề bài viết'} />
              {v.seoTitle.length > 60 && <p className="text-xs text-amber-600 mt-1">⚠ Dài hơn 60 ký tự, Google có thể cắt bớt.</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Meta description ({v.metaDescription.length}/160 khuyến nghị)</label>
              <textarea value={v.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} className={`${field} h-16 resize-none`} placeholder="Để trống = tự lấy từ sa-pô hoặc nội dung" />
              {v.metaDescription.length > 160 && <p className="text-xs text-amber-600 mt-1">⚠ Dài hơn 160 ký tự, Google có thể cắt bớt.</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Canonical URL</label>
              <input value={v.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} className={field} placeholder="Để trống = tự dùng /news/{slug}" />
              {canonicalIsForeign && <p className="text-xs text-red-600 mt-1">⚠ Trỏ sang nơi khác — bài này sẽ KHÔNG có trong sitemap của site.</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t">
        <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
          {submitting ? 'Đang lưu...' : mode === 'create' ? 'Lưu bài viết' : 'Lưu cập nhật'}
        </button>
      </div>
    </form>
  );
}
