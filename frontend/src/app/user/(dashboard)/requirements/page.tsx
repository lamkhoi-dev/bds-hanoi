"use client";

import { useEffect, useState } from "react";
import { propertyTypeByEnum } from '@/lib/seo/taxonomy';
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { getAuthToken } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { confirmAction } from "@/lib/toast-helpers";

type Requirement = {
  id: string;
  transactionType?: string | null;
  propertyType?: string | null;
  phone?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  areaMin?: number | null;
  areaMax?: number | null;
  content?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

function transactionLabel(value?: string | null) {
  if (value === "CAN_MUA") return "Cần mua";
  if (value === "CAN_THUE") return "Cần thuê";
  return value || "Chưa xác định";
}

function propertyTypeLabel(value?: string | null) {
  // Bản đồ cục bộ cũ có nhãn lệch với 7 nơi khác ("Mặt bằng / kho xưởng").
  if (!value) return "Chưa xác định";
  return propertyTypeByEnum(value)?.label || value;
}

function statusLabel(value?: string | null) {
  if (value === "APPROVED") return "Đã duyệt";
  if (value === "REJECTED") return "Bị từ chối";
  if (value === "MATCHED") return "Đã ghép nhu cầu";
  if (value === "CLOSED") return "Đã đóng";
  return "Đang chờ xử lý";
}



function priceRangeLabel(item: Requirement) {
  if (item.priceMin && item.priceMax) return `${formatPrice(item.priceMin)} - ${formatPrice(item.priceMax)}`;
  if (item.priceMin) return `Từ ${formatPrice(item.priceMin)}`;
  if (item.priceMax) return `Đến ${formatPrice(item.priceMax)}`;
  return "Thỏa thuận";
}

function areaRangeLabel(item: Requirement) {
  if (item.areaMin && item.areaMax) return `${item.areaMin} - ${item.areaMax} m²`;
  if (item.areaMin) return `Từ ${item.areaMin} m²`;
  if (item.areaMax) return `Đến ${item.areaMax} m²`;
  return "Chưa xác định";
}

export default function UserRequirementsPage() {
  const router = useRouter();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login?returnUrl=/user/requirements");
      return;
    }

    api
      .get("/requirements/my")
      .then((res) => {
        setRequirements(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setRequirements([]);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (await confirmAction('Bạn có chắc chắn muốn xóa nhu cầu này?')) {
      try {
        await api.delete(`/requirements/${id}`);
        setRequirements(requirements.filter(req => req.id !== id));
        toast.success('Xóa nhu cầu thành công');
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa nhu cầu');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 shadow-card">Đang tải nhu cầu của bạn...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-textMain">Nhu cầu của tôi</h1>
            <p className="mt-2 text-textSecondary">Quản lý các nhu cầu cần mua/cần thuê đã gửi</p>
          </div>
          <Link
            href="/post?type=CAN_MUA"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-white hover:bg-primary-dark"
          >
            Tạo nhu cầu mới
          </Link>
        </div>

        {requirements.length === 0 ? (
          <div className="rounded-2xl border border-borderLight bg-white p-10 text-center shadow-card">
            <h2 className="text-xl font-bold text-textMain">Bạn chưa gửi nhu cầu nào</h2>
            <p className="mt-2 text-textSecondary">Hãy tạo nhu cầu cần mua/cần thuê để admin hỗ trợ bạn nhanh hơn.</p>
            <Link
              href="/post?type=CAN_MUA"
              className="mt-6 inline-flex rounded-xl bg-accent px-6 py-3 font-bold text-white hover:opacity-90"
            >
              Tạo nhu cầu mới
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {requirements.map((item) => (
              <div key={item.id} className="rounded-2xl border border-borderLight bg-white p-6 shadow-card">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.transactionType === 'CAN_MUA' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {transactionLabel(item.transactionType)}
                      </span>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                        {propertyTypeLabel(item.propertyType)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        item.status === 'MATCHED' ? 'bg-green-100 text-green-700' :
                        item.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-textSecondary">
                      Ngày gửi: {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "Chưa xác định"}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 sm:self-start shrink-0"
                  >
                    <Trash2 className="h-4 w-4" /> Xóa
                  </button>
                </div>

                <div className="grid gap-3 border-y border-gray-100 py-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-textSecondary">Khoảng giá</p>
                    <p className="font-bold text-textMain">{priceRangeLabel(item)}</p>
                  </div>
                  <div>
                    <p className="text-textSecondary">Diện tích</p>
                    <p className="font-bold text-textMain">{areaRangeLabel(item)}</p>
                  </div>
                  <div>
                    <p className="text-textSecondary">Số điện thoại</p>
                    <p className="font-bold text-textMain">{item.phone || "Chưa cập nhật"}</p>
                  </div>
                </div>

                {item.content && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-bold text-textMain">Nội dung nhu cầu</p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-textSecondary">{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
