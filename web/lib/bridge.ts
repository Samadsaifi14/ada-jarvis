import { NextResponse } from 'next/server';

const BRIDGE_URL = (process.env.LOCAL_BRIDGE_URL || '').replace(/\/+$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || '';

const NOT_CONFIGURED =
  'Local bridge URL is not configured. Start local-bridge/server.js, expose it with a tunnel and set LOCAL_BRIDGE_URL.';

export async function bridgeRequest(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number } = {}
): Promise<NextResponse> {
  if (!BRIDGE_URL) {
    return NextResponse.json({ success: false, error: NOT_CONFIGURED }, { status: 400 });
  }
  if (!BRIDGE_SECRET) {
    return NextResponse.json({ success: false, error: 'BRIDGE_SECRET is not configured.' }, { status: 500 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 300_000);

  try {
    const response = await fetch(`${BRIDGE_URL}${path}`, {
      method: options.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BRIDGE_SECRET}`,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Local bridge unreachable. Check that the tunnel and local-bridge are running.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
