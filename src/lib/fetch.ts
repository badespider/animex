export async function fetchWithRetry(url: string, init: RequestInit & { timeoutMs?: number } = {}, retries = 2, backoffMs = 500): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok && retries > 0 && res.status >= 500) {
      await new Promise(r => setTimeout(r, backoffMs));
      return fetchWithRetry(url, init, retries - 1, backoffMs * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoffMs));
      return fetchWithRetry(url, init, retries - 1, backoffMs * 2);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}
