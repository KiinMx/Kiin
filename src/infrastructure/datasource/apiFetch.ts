export async function apiFetch(path: string, init?: RequestInit) {
  const origin = (typeof window !== "undefined" && (globalThis as { location?: { origin?: string } }).location?.origin)
    ? (globalThis as { location?: { origin?: string } }).location!.origin
    : (process.env.TEST_BASE_URL ?? "http://localhost:3000");

  return fetch(origin + path, init);
}

export default apiFetch;