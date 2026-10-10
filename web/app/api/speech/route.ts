import { NextResponse } from 'next/server';
import { bridgeRequest } from '@/lib/bridge';

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { audioBase64?: unknown; mime?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof body.audioBase64 !== 'string' || body.audioBase64.length < 16) {
    return NextResponse.json({ error: 'Audio payload is required.' }, { status: 400 });
  }

  return bridgeRequest('/speech', {
    body: { audioBase64: body.audioBase64, mime: typeof body.mime === 'string' ? body.mime : 'audio/webm' },
    timeoutMs: 60_000,
  });
}