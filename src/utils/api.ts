const TOKEN_KEY = 'iptv_pro_token';
const AUTH_KEY = 'iptv_pro_auth';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSession(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore storage errors
  }
}

// Drop-in replacement for fetch() that attaches the session token and
// redirects to the login screen if the server reports the session is gone.
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });

  // Only force a reload if we actually had a session that got rejected —
  // otherwise an unauthenticated call (e.g. on the login screen, with no
  // token yet) would 401 and reload in an infinite loop.
  if (res.status === 401 && token) {
    clearSession();
    window.location.reload();
  }

  return res;
}
