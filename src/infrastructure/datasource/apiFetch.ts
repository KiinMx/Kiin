export async function apiFetch(path: string, init?: RequestInit) {
  const origin = (typeof window !== "undefined" && (globalThis as any).location && (globalThis as any).location.origin)
    ? (globalThis as any).location.origin
    : (process.env.TEST_BASE_URL ?? "http://localhost:3000");

  return fetch(origin + path, init);
}

export default apiFetch;