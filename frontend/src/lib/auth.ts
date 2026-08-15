export function getAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  // Read isLoggedIn cookie flag instead of localStorage token
  return document.cookie.split('; ').find(row => row.startsWith('isLoggedIn='))?.split('=')[1] === '1';
}

/** Alias for readability */
export const isLoggedIn = getAuthToken;

/** Clear login state (cookie + any leftover localStorage) on logout */
export function clearAuthState() {
  if (typeof window === 'undefined') return;
  document.cookie = 'isLoggedIn=; Max-Age=0; path=/';
  // Clean up legacy localStorage tokens if any
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  } catch { /* SSR safe */ }
}

export function isUnauthorizedError(error: any) {
  return error?.response?.status === 401;
}

export function loginUrl(returnUrl?: string) {
  const target = returnUrl || (typeof window !== 'undefined' ? window.location.pathname : '/');
  return `/login?returnUrl=${encodeURIComponent(target)}`;
}
