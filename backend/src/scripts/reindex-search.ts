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
 * Chạy:  node dist/scripts/reindex-search.js
 */
import { PrismaClient } from '@prisma/client';
import { normalizeSearchDocument } from '../search/search-document';

const prisma = new PrismaClient();
const BATCH = 200;

/**
 * Chờ một tác vụ của Meilisearch xong.
 *
 * Chỗ đặt hàm này đổi theo phiên bản client — `client.tasks.*` ở 0.5x, `index.waitForTask` /
 * `client.waitForTask` ở các bản trước. Thử lần lượt rồi mới tự hỏi hàng đợi, để script còn
 * chạy được nếu sau này ai đó nâng hay hạ phiên bản.
 */
async function waitForTask(client: any, index: any, taskUid: number) {
  const tasks = client?.tasks;
  if (typeof tasks?.waitForTask === 'function') return tasks.waitForTask(taskUid, { timeout: 120_000 });
  if (typeof index?.waitForTask === 'function') return index.waitForTask(taskUid, { timeOutMs: 120_000 });
  if (typeof client?.waitForTask === 'function') return client.waitForTask(taskUid, { timeOutMs: 120_000 });

  const getTask = typeof tasks?.getTask === 'function'
    ? (uid: number) => tasks.getTask(uid)
    : typeof client?.getTask === 'function'
      ? (uid: number) => client.getTask(uid)
      : null;
  if (!getTask) throw new Error('Client Meilisearch không có cách nào hỏi trạng thái tác vụ.');

  for (let i = 0; i < 240; i++) {
    const t = await getTask(taskUid);
    if (t?.status === 'succeeded') return t;
    if (t?.status === 'failed' || t?.status === 'canceled') {
      throw new Error(`Tác vụ ${taskUid} ${t.status}: ${t?.error?.message ?? ''}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Tác vụ ${taskUid} chờ quá lâu.`);
}

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
    //
    // Tên hàm chờ đổi theo phiên bản client (`index.waitForTask` ở bản mới,
    // `client.waitForTask` ở bản cũ), nên thử lần lượt rồi mới rơi về tự hỏi hàng đợi.
    await waitForTask(client, index, task.taskUid);

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
