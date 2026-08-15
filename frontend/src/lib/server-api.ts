export function serverApiUrl(path: string) {
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const baseUrl =
    process.env.INTERNAL_API_URL ||
    (process.env.NODE_ENV === 'production' && publicApiUrl?.startsWith('/') ? undefined : publicApiUrl) ||
    (process.env.NODE_ENV === 'production' ? 'http://backend:4000/api/v1' : 'http://localhost:4000/api/v1');

  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedBase === '/api') return `/api/v1${normalizedPath}`;
  return `${normalizedBase}${normalizedPath}`;
}
