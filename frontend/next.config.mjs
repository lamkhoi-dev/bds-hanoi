import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextPackageInProject = path.join(__dirname, "node_modules", "next", "package.json");
const turbopackRoot = fs.existsSync(nextPackageInProject) ? __dirname : path.resolve(__dirname, "..");

/**
 * Bật dạng URL mới `/{giao-dịch}/{loại}/{khu-vực}`.
 * Cùng cờ với `lib/seo/canonical.ts#listingPath`, nên bảng redirect và link nội bộ
 * luôn đổi cùng lúc — link nội bộ không bao giờ trỏ vào một 301.
 */
const SEO_ENFORCE = process.env.NEXT_PUBLIC_SEO_MODE === "enforce";

/** Domain của site, để cấu hình ảnh và dev origin không phải viết cứng. */
const SITE_HOSTNAME = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    return raw ? new URL(raw).hostname : "";
  } catch {
    return "";
  }
})();

// KHÔNG có "du-an" — /du-an giờ là trang danh mục Dự án (model Project, thực thể
// riêng), không còn là danh mục lọc propertyType=DU_AN nữa. Ở chế độ enforce, vòng lặp
// bên dưới 301 mọi slug trong danh sách này về `/ban/{slug}`; còn "du-an" trong đó sẽ
// đè lên đúng URL của trang Dự án mới, xoá sổ nó ngay khi bật enforce.
const PROPERTY_TYPE_SLUGS = [
  "dat-nen",
  "nha-rieng",
  "chung-cu",
  "mat-bang-kho-xuong",
  "biet-thu",
  "bds-khac",
];

/** Slug cũ trỏ về cùng một loại BĐS — hai URL cùng nội dung, phải gộp. */
const TYPE_ALIASES = {
  "nha-mat-pho": "nha-rieng",
  "mat-bang": "mat-bang-kho-xuong",
  "can-ho": "chung-cu",
  "can-ho-chung-cu": "chung-cu",
  khac: "bds-khac",
};

const PROFILE_SLUG_PATTERN =
  "/:slug([\\w-]+-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.56.1", "localhost", "backend", SITE_HOSTNAME].filter(Boolean),
  turbopack: {
    root: turbopackRoot,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(SITE_HOSTNAME ? [{ protocol: "https", hostname: SITE_HOSTNAME }] : []),
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
    ],
  },
  typescript: {
    // TODO: bật lại kiểm tra kiểu lúc build. Hiện `npm run typecheck` đã sạch ở cả hai
    // workspace, nhưng đổi cờ này ngay có thể làm gãy build deploy vì `next build` phân
    // giải kiểu khác `tsc -p`. Nên bật kèm một lần chạy build thật để đối chứng.
    ignoreBuildErrors: true,
  },
  async redirects() {
    // ---- Luôn bật: gộp URL trùng nội dung, không liên quan tới việc đổi dạng URL ----
    const redirects = [
      // Thay cho cái hack notFound() cho riêng 'sitemap' trong catch-all trước đây.
      { source: "/sitemap", destination: "/sitemap.xml", statusCode: 301 },

      // /tin-tuc trước đây là REWRITE nên trang tin tức phục vụ ở hai URL mà không có
      // canonical nối chúng lại — đúng nhóm "trang trùng lặp" trong Search Console.
      { source: "/tin-tuc", destination: "/news", statusCode: 301 },

      // Hồ sơ công khai chỉ còn một URL chuẩn. Trước đây `/{slug}-{uuid}` là rewrite,
      // nên cùng một hồ sơ tồn tại ở hai đường dẫn với hành vi khác nhau.
      { source: PROFILE_SLUG_PATTERN, destination: "/user/:slug", statusCode: 301 },

      // Khách chốt /ban là URL danh sách chính; /tat-ca và /toan-bo-tin gộp về đó.
      { source: "/tat-ca", destination: "/ban", statusCode: 301 },
      { source: "/tat-ca/:location", destination: "/ban/:location", statusCode: 301 },
      { source: "/toan-bo-tin", destination: "/ban", statusCode: 301 },
    ];

    // Gộp alias loại BĐS. `nha-mat-pho` không có enum riêng ở backend (nó ánh xạ về
    // NHA_RIENG) nhưng frontend từng coi là danh mục độc lập -> hai URL cạnh tranh nhau.
    for (const [alias, canonical] of Object.entries(TYPE_ALIASES)) {
      const base = SEO_ENFORCE ? `/ban/${canonical}` : `/${canonical}`;
      redirects.push(
        { source: `/${alias}`, destination: base, statusCode: 301 },
        { source: `/${alias}/:location`, destination: `${base}/:location`, statusCode: 301 },
      );
    }

    if (!SEO_ENFORCE) return redirects;

    // ---- Chỉ bật ở chế độ enforce: đổi sang dạng /{giao-dịch}/{loại}/{khu-vực} ----
    for (const slug of PROPERTY_TYPE_SLUGS) {
      redirects.push(
        { source: `/${slug}`, destination: `/ban/${slug}`, statusCode: 301 },
        { source: `/${slug}/:location`, destination: `/ban/${slug}/:location`, statusCode: 301 },
      );
    }

    return redirects;
  },
  async rewrites() {
    return [
      // `/tin-tuc` và `/{slug}-{uuid}` đã chuyển thành redirect ở trên.
      { source: "/api/v1/socket.io", destination: `http://backend:4000/api/v1/socket.io/` },
      { source: "/api/:path*", destination: `http://backend:4000/api/:path*` },
      { source: "/socket.io/:path*", destination: `http://backend:4000/socket.io/:path*` },
      {
        source: "/bds-uploads/:path*",
        destination: `${process.env.UPLOADS_URL || "http://backend:4000/bds-uploads"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
