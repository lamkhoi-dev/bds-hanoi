/**
 * Dọn rác HTML dán từ Word/Excel/Outlook trước khi đưa vào TipTap — Word chèn cả một tầng
 * markup riêng (điều kiện `<!--[if ...]>`, thẻ `o:p`, class/style `mso-*`) mà TipTap không
 * hiểu, để nguyên thì `Mso` bám theo như một đống class vô nghĩa và `<!--[if !supportLists]-->`
 * hiện ra như chữ thường trên trang.
 *
 * Chạy TRƯỚC khi TipTap parse (không phải sau) — làm ở tầng chuỗi thô, không phải làm sạch
 * lại sau khi đã thành node TipTap.
 */
export function cleanPastedHtml(html: string): string {
  if (!html) return html;
  return html
    // Word dùng 2 dạng "điều kiện" khác nhau, PHẢI xử lý riêng:
    //   - Dạng ẩn nội dung:  <!--[if gte mso 9]>...xml ẩn...<![endif]-->
    //     Mở đầu kết thúc bằng "]>" (không phải "]-->") nên trình duyệt coi TOÀN BỘ, kể cả
    //     nội dung bên trong, là MỘT comment dài — xoá cả khối.
    //   - Dạng đánh dấu quanh nội dung THẬT: <!--[if !supportLists]-->1.<!--[endif]-->
    //     Mỗi marker tự nó là một comment TRỌN VẸN (kết thúc bằng "]-->" ngay), nội dung ở
    //     giữa là HTML bình thường — chỉ bỏ 2 marker, GIỮ nguyên nội dung giữa chúng.
    .replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--\[if[^\]]*\]-->/gi, '')
    .replace(/<!--\[endif\]-->/gi, '')
    // Toàn khối không hiển thị: style/script/xml/meta/link
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    // Thẻ riêng của Word (o:p, w:sdt...) — bỏ thẻ, giữ chữ bên trong.
    .replace(/<\/?o:p[^>]*>/gi, '')
    .replace(/<\/?\w+:\w+[^>]*>/gi, '')
    // class="MsoNormal Mso..." và style="mso-...:...;" — bỏ TOÀN BỘ giá trị chứa "Mso"/"mso-",
    // không cố tách riêng từng khai báo vì Word luôn trộn chung với style thật.
    .replace(/\sclass="[^"]*Mso[^"]*"/gi, '')
    .replace(/\sstyle="[^"]*mso-[^"]*"/gi, '')
    // Khoảng trắng thừa do các bước trên để lại.
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
