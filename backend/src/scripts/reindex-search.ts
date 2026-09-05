/**
 * Nạp lại toàn bộ tin đăng vào chỉ mục Meilisearch.
 *
 * Cần đến khi HÌNH DẠNG tài liệu đổi — thêm trường lọc mới, hay đổi kiểu dữ liệu của một
 * trường đã có. Chỉ mục không tự cập nhật theo code: tài liệu cũ nằm nguyên đó với kiểu cũ,
 * và Meilisearch không báo lỗi khi so sánh số với một trường lưu dạng chuỗi — nó trả 0 kết
 * quả, im lặng. Đó đúng là cách lọc khoảng giá hỏng suốt mà không ai thấy (xem
 * `search-document.ts`).
 *
 * An toàn: chỉ GHI ĐÈ theo `id`, không xoá chỉ mục trước. Nếu script chết giữa chừng thì
 * phần đã ghi là dữ liệu mới, phần còn lại vẫn là dữ liệu cũ — site vẫn tìm được, chỉ là
 * chạy lại cho xong.
 *
 * Chạy:  node dist/src/scripts/reindex-search.js
 */
import { PrismaClient } from '@prisma/client';
import { normalizeSearchDocument } from '../search/search-document';

const prisma = new PrismaClient();
const BATCH = 200;

async function main() {
  const { Meilisearch } = await eval(`import('meilisearch')`);
  const client = new Meilisearch({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_KEY || process.env.MEILISEARCH_MASTER_KEY,
  });
  const index = client.index('properties');

  const total = await prisma.property.count();
  console.log(`Có ${total} tin trong CSDL.`);

  let done = 0;
  let cursor: string | undefined;

  for (;;) {
    const rows = await prisma.property.findMany({
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      include: { user: true },
    });
    if (rows.length === 0) break;

    const docs = rows.map((r) => normalizeSearchDocument(r as any));
    const task = await index.addDocuments(docs, { primaryKey: 'id' });
    // Chờ từng lô xử lý xong rồi mới gửi lô sau: gửi dồn thì hàng đợi của Meilisearch phình
    // ra và không biết lô nào hỏng.
    await index.waitForTask(task.taskUid, { timeOutMs: 120_000 });

    done += rows.length;
    cursor = rows[rows.length - 1].id;
    console.log(`  đã nạp ${done}/${total}`);
  }

  // Kiểm ngay tại chỗ: nếu tiền vẫn là chuỗi thì phép so sánh này trả 0, và người chạy phải
  // biết ngay chứ không phải đợi khách báo.
  const probe = await index.search('', { filter: 'price <= 99999999999', limit: 0 });
  const hits = probe.estimatedTotalHits ?? 0;
  console.log(`\nKiểm tra: lọc "price <= 99999999999" khớp ${hits} tin.`);
  if (hits === 0) {
    console.error('THẤT BẠI: điều kiện đáng lẽ khớp mọi tin có giá lại ra 0 — tiền vẫn không phải kiểu số.');
    process.exit(1);
  }
  console.log('XONG.');
}

main()
  .catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
