// Relative path — proxied by Vite dev server to http://127.0.0.1:8000/graphql/
// Set VITE_API_URL in .env to override for production builds
const GRAPHQL_URL = (import.meta as any).env?.VITE_API_URL || '/graphql/';
const TOKEN_KEY = 'farmpulse_jwt';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function gqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = token !== undefined ? token : getToken();
  if (t) headers['Authorization'] = `JWT ${t}`;

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Network error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}
