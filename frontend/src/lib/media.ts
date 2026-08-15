export function toMediaUrl(path?: string | null) {
  if (!path) return '';
  
  // If the path is an absolute URL pointing to the backend's upload directory (e.g. from the database),
  // convert it to a relative path. The Next.js rewrite rule in next.config.mjs will proxy it securely over HTTPS.
  if (path.includes('/bds-uploads')) {
    const uploadIndex = path.indexOf('/bds-uploads');
    return path.substring(uploadIndex);
  }

  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  const baseUrl =
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');
  if (!baseUrl) return path;

  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedBase === '/api') return `/api${normalizedPath}`;
  return `${normalizedBase}${normalizedPath}`;
}
