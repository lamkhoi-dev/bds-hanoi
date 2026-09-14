/**
 * Bỏ `<img>` nhúng thẳng dữ liệu (`src="data:..."`) hoặc trỏ vào ổ đĩa máy người dùng
 * (`src="file:..."`) khỏi một đoạn HTML dán vào trình soạn thảo.
 *
 * Khách báo 12/9: "không đăng được tin tức trên PC". Gốc: dán ảnh chụp màn hình hoặc nội
 * dung từ Word/Google Docs vào `SimpleEditor` chèn thẳng `<img src="data:image/...;base64,
 * ...">` vào nội dung — một ảnh chụp bình thường đã vượt xa giới hạn thân request, làm
 * `POST /api/v1/news` bị máy chủ từ chối (`PayloadTooLargeError`, log 07/09 ghi 15 lần).
 *
 * `src="file:..."` (ảnh dán từ Word trên Windows) cũng bị bỏ vì trỏ vào máy người dán —
 * người khác mở bài viết sẽ không thấy ảnh đó, giữ lại chỉ tạo ảo giác "đã chèn được".
 *
 * Tách thành hàm thuần để test được — không phụ thuộc DOM hay trình duyệt.
 */
export function stripEmbeddedImages(html: string): { html: string; removed: number } {
  if (!html) return { html: html ?? '', removed: 0 };
  let removed = 0;
  const cleaned = html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\ssrc\s*=\s*["'](data:|file:)/i.test(tag)) {
      removed++;
      return '';
    }
    return tag;
  });
  return { html: cleaned, removed };
}
