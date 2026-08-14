/**
 * Tiền kiểm CHỈ ĐỌC trước khi deploy lên một CSDL đang chạy production.
 *
 * Script này KHÔNG GHI GÌ. Nó trả lời đúng một câu: chạy `prisma migrate deploy` lên
 * CSDL này có an toàn không, và nếu không thì vướng ở đâu.
 *
 * Vì sao cần: lịch sử migration trong repo từng KHÔNG dựng lại được schema hiện tại
 * (bảng News được đưa lên bằng `db push`). Những lệch pha kiểu đó chỉ lộ ra khi đối
 * chiếu với CSDL thật, và lộ ra lúc container đang khởi động thì đã muộn.
 *
 * Chạy:  DATABASE_URL="..." npx ts-node src/scripts/preflight-check.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const problems: string[] = [];
const warnings: string[] = [];

function ok(msg: string) {
  console.log(`  [OK]    ${msg}`);
}
function bad(msg: string) {
  console.log(`  [CHẶN]  ${msg}`);
  problems.push(msg);
}
function warn(msg: string) {
  console.log(`  [LƯU Ý] ${msg}`);
  warnings.push(msg);
}

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ${name}`;
  return Number(rows[0]?.n ?? 0) > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}`;
  return Number(rows[0]?.n ?? 0) > 0;
}

async function main() {
  console.log('\n=== TIỀN KIỂM CSDL (chỉ đọc, không ghi gì) ===\n');

  // ---------- 1. Lịch sử migration ----------
  console.log('1. Lịch sử migration');
  if (!(await tableExists('_prisma_migrations'))) {
    bad(
      'Không có bảng _prisma_migrations. CSDL này được dựng bằng `db push`, ' +
        'nên `migrate deploy` sẽ cố chạy lại migration đầu tiên và hỏng. ' +
        'Phải baseline trước: `prisma migrate resolve --applied <tên_migration>` cho từng migration cũ.',
    );
  } else {
    const applied = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
      SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at`;
    ok(`Đã ghi nhận ${applied.length} migration.`);
    const failed = applied.filter((m) => !m.finished_at);
    if (failed.length > 0) {
      bad(
        `Có ${failed.length} migration ở trạng thái DỞ DANG: ` +
          failed.map((f) => f.migration_name).join(', ') +
          '. Phải giải quyết bằng `prisma migrate resolve` trước.',
      );
    }
    const pending = [
      '20260813235959_add_news_table',
      '20260814000000_add_news_previous_slugs',
      '20260814010000_add_property_content_updated_at',
      '20260814020000_location_url_segments',
      '20260814030000_location_group',
      '20260814040000_property_short_code',
    ].filter((n) => !applied.some((a) => a.migration_name === n));
    console.log(`  → Sẽ áp ${pending.length} migration: ${pending.join(', ') || '(không có)'}`);
  }

  // ---------- 2. Bảng News ----------
  console.log('\n2. Bảng News (từng được tạo ngoài migration)');
  if (await tableExists('News')) {
    ok('Bảng News đã tồn tại — migration 20260813235959 sẽ là no-op nhờ IF NOT EXISTS.');
  } else {
    ok('Chưa có bảng News — migration 20260813235959 sẽ tạo.');
  }

  // ---------- 3. Location: điều kiện của migration nặng nhất ----------
  console.log('\n3. Location — điều kiện cho 20260814020000');
  if (!(await tableExists('Location'))) {
    warn('Chưa có bảng Location. CSDL trắng thì không có gì phải backfill.');
  } else {
    const total = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "Location"`;
    const count = Number(total[0]?.n ?? 0);
    console.log(`  → ${count} bản ghi Location.`);

    if (await columnExists('Location', 'urlSegment')) {
      ok('Đã có cột urlSegment — migration này đã chạy rồi.');
    } else if (count > 0) {
      // 3a. type lạ sẽ làm bước ép enum ném lỗi
      const types = await prisma.$queryRaw<{ type: string; n: bigint }[]>`
        SELECT "type", count(*) AS n FROM "Location" GROUP BY "type" ORDER BY n DESC`;
      const known = new Set(['CITY', 'DISTRICT', 'WARD', 'OLD_WARD', 'PROVINCE', 'TINH', 'THANH_PHO']);
      const unknown = types.filter((t) => !known.has(String(t.type ?? '').trim().toUpperCase()));
      console.log(`  → Giá trị type: ${types.map((t) => `${t.type}(${t.n})`).join(', ')}`);
      if (unknown.length > 0) {
        bad(
          'Cột type có giá trị không ép được sang enum: ' +
            unknown.map((u) => `"${u.type}" (${u.n} dòng)`).join(', '),
        );
      } else {
        ok('Mọi giá trị type đều ép được sang enum LocationType.');
      }

      // 3b. slug NULL -> migration dừng (đúng ý đồ, nhưng phải biết trước)
      const nullSlug = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM "Location" WHERE "slug" IS NULL OR trim("slug") = ''`;
      if (Number(nullSlug[0]?.n ?? 0) > 0) {
        bad(`${nullSlug[0].n} bản ghi Location thiếu slug — migration sẽ dừng ở chốt chặn.`);
      } else {
        ok('Mọi Location đều có slug.');
      }

      // 3c. slug trùng -> unique index urlSegment sẽ hỏng
      const dupSlug = await prisma.$queryRaw<{ slug: string; n: bigint }[]>`
        SELECT "slug", count(*) AS n FROM "Location" GROUP BY "slug" HAVING count(*) > 1 LIMIT 10`;
      if (dupSlug.length > 0) {
        bad(
          'Có slug trùng nhau, index UNIQUE trên urlSegment sẽ tạo hỏng: ' +
            dupSlug.map((d) => `${d.slug}(${d.n})`).join(', '),
        );
      } else {
        ok('Slug duy nhất — urlSegment kế thừa được nguyên trạng, URL đang index KHÔNG đổi.');
      }

      // 3d. parentId mồ côi -> không dựng được path
      const orphan = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM "Location" c
         WHERE c."parentId" IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM "Location" p WHERE p."id" = c."parentId")`;
      if (Number(orphan[0]?.n ?? 0) > 0) {
        bad(`${orphan[0].n} bản ghi Location có parentId mồ côi — không dựng được path, migration sẽ dừng.`);
      } else {
        ok('Không có parentId mồ côi — CTE đệ quy dựng đủ path cho mọi cấp.');
      }

      // 3e. Các tỉnh gốc: đối chiếu với ACTIVE_PROVINCE_SLUG
      const roots = await prisma.$queryRaw<{ name: string; slug: string }[]>`
        SELECT "name", "slug" FROM "Location" WHERE "parentId" IS NULL ORDER BY "name"`;
      console.log(`  → Tỉnh gốc: ${roots.map((r) => `${r.name} (${r.slug})`).join(', ') || '(không có)'}`);
      const active = (process.env.ACTIVE_PROVINCE_SLUG || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (active.length === 0) {
        warn('Chưa đặt ACTIVE_PROVINCE_SLUG — mặc định "ha-noi", sẽ lọc sạch dữ liệu Nghệ An.');
      } else {
        const missing = roots.filter((r) => !active.includes(r.slug));
        if (missing.length > 0) {
          warn(
            `ACTIVE_PROVINCE_SLUG="${active.join(',')}" KHÔNG gồm: ` +
              missing.map((m) => m.slug).join(', ') +
              ' — khu vực của các tỉnh này sẽ biến mất khỏi bộ lọc, menu và sitemap.',
          );
        } else {
          ok(`ACTIVE_PROVINCE_SLUG="${active.join(',')}" phủ hết tỉnh gốc đang có.`);
        }
      }
    }
  }

  // ---------- 4. Property ----------
  console.log('\n4. Property — điều kiện cho 20260814040000');
  if (!(await tableExists('Property'))) {
    warn('Chưa có bảng Property.');
  } else {
    const n = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "Property"`;
    console.log(`  → ${n[0]?.n ?? 0} tin đăng sẽ được cấp shortCode.`);
    if (await columnExists('Property', 'shortCode')) {
      ok('Đã có cột shortCode — migration này đã chạy rồi.');
    } else {
      ok('Backfill dùng sequence nên không thể trùng mã, dù bao nhiêu tin.');
    }
  }

  // ---------- Kết luận ----------
  console.log('\n=== KẾT LUẬN ===');
  if (problems.length > 0) {
    console.log(`\n  ✗ KHÔNG ĐƯỢC DEPLOY — ${problems.length} vấn đề chặn:\n`);
    problems.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  } else {
    console.log('\n  ✓ Không có vấn đề chặn.');
  }
  if (warnings.length > 0) {
    console.log(`\n  ${warnings.length} lưu ý cần đọc kỹ:\n`);
    warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
  }
  console.log('\n  Dù kết quả thế nào: SAO LƯU trước, và diễn tập trên BẢN SAO trước.\n');

  process.exitCode = problems.length > 0 ? 1 : 0;
}

main()
  .catch((e) => {
    console.error('\nLỗi khi tiền kiểm:', e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
