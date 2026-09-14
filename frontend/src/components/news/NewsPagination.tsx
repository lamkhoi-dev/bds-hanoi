import Link from 'next/link';

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/** Cùng quy ước với `app/du-an/[slug]/page.tsx`: `<link rel="prev/next">` cho máy tìm kiếm + 2 nút Trang trước/sau. */
export default function NewsPagination({ basePath, page, pageCount }: { basePath: string; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;

  return (
    <>
      {page > 1 && <link rel="prev" href={pageHref(basePath, page - 1)} />}
      {page < pageCount && <link rel="next" href={pageHref(basePath, page + 1)} />}
      <div className="mt-10 flex justify-center items-center gap-2">
        {page > 1 && (
          <Link href={pageHref(basePath, page - 1)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Trang trước
          </Link>
        )}
        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Trang {page} / {pageCount}
        </span>
        {page < pageCount && (
          <Link href={pageHref(basePath, page + 1)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Trang sau
          </Link>
        )}
      </div>
    </>
  );
}
