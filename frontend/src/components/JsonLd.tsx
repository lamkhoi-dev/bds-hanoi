import type { JsonLdNode } from '@/lib/seo/schema';

/**
 * Render MỘT khối JSON-LD dạng `@graph` cho cả trang.
 *
 * Gom về một khối thay vì rải nhiều thẻ `<script>` để các node tham chiếu chéo nhau
 * bằng `@id` (breadcrumb -> website -> organization), Google hiểu được quan hệ thực thể.
 *
 * Việc escape trước đây bị lặp ở 2 chỗ trong tin/[slug_id]/page.tsx; giờ chỉ ở đây.
 */
export default function JsonLd({ graph }: { graph: JsonLdNode[] }) {
  const nodes = graph.filter(Boolean);
  if (nodes.length === 0) return null;

  const payload = {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(payload) }}
    />
  );
}

/**
 * `<` bắt buộc phải escape để chuỗi `</script>` trong dữ liệu không đóng sớm thẻ script.
 * `<` vẫn là JSON hợp lệ nên trình phân tích của Google đọc lại đúng ký tự gốc.
 */
function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
