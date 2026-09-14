/**
 * Kiểm ảnh đại diện so với khuyến nghị khách nêu 12/9: "Ảnh đại diện đổi khuyến nghị từ
 * 800×450 lên tối thiểu 1200×675" (tỷ lệ 16:9, đúng khổ Facebook/Zalo share card).
 *
 * CHỈ CẢNH BÁO, không chặn đăng — admin có thể cố tình dùng ảnh khác tỷ lệ (vd ảnh chân
 * dung minh hoạ) và vẫn cần đăng được bài.
 */
export interface ImageSizeCheck {
  ok: boolean;
  message: string | null;
}

const MIN_WIDTH = 1200;
const MIN_HEIGHT = 675;
const TARGET_RATIO = MIN_WIDTH / MIN_HEIGHT; // 16:9
const RATIO_TOLERANCE = 0.08; // ~lệch trong khoảng 15:9 - 17:9 coi như "gần đúng 16:9"

export function checkFeaturedImageSize(width?: number | null, height?: number | null): ImageSizeCheck {
  if (!width || !height) return { ok: true, message: null };

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return {
      ok: false,
      message: `Ảnh ${width}×${height}px nhỏ hơn khuyến nghị tối thiểu ${MIN_WIDTH}×${MIN_HEIGHT}px — có thể mờ khi chia sẻ lên Facebook/Zalo.`,
    };
  }

  const ratio = width / height;
  if (Math.abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE) {
    return {
      ok: false,
      message: `Ảnh ${width}×${height}px không đúng tỷ lệ 16:9 khuyến nghị — ảnh có thể bị cắt xén khi hiển thị.`,
    };
  }

  return { ok: true, message: null };
}
