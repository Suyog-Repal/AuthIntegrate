/**
 * getApiBase()
 *
 * Returns the base URL for all API calls.
 *  - In local development: "" (empty string) → Vite proxies /api → localhost:5010
 *  - In production (Vercel): "https://authintegrate-backend.onrender.com" (from VITE_API_URL)
 *
 * Usage:  fetch(`${getApiBase()}/api/auth/login`, ...)
 */
export function getApiBase(): string {
  const url = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (!url) return ''; // dev: Vite proxy handles /api/*
  // Strip trailing /api so callers can build paths themselves
  return url.replace(/\/api\/?$/, '');
}
