import { NextResponse } from 'next/server';
import { bridgeRequest } from '@/lib/bridge';

export const maxDuration = 60;

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get('status') || 'pending';
  return bridgeRequest(`/approvals?status=${encodeURIComponent(status)}`, { method: 'GET', timeoutMs: 15_000 });
}

export async function POST(req: Request) {
  let body: { id?: unknown; approved?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof body.id !== 'string' || !body.id.trim()) {
    return NextResponse.json({ error: 'Approval id is required.' }, { status: 400 });
  }

  return bridgeRequest(`/approvals/${encodeURIComponent(body.id)}`, {
    body: { approved: Boolean(body.approved) },
    timeoutMs: 60_000,
  });
}
