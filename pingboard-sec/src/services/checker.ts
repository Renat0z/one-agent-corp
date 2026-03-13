export async function runCheck(url: string): Promise<{ ok: boolean, status: number, latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Pingboard-Sec/1.0' },
      signal: AbortSignal.timeout(parseInt(process.env.CHECK_TIMEOUT_MS || '5000'))
    });
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      latency: Date.now() - start
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      latency: Date.now() - start
    };
  }
}
