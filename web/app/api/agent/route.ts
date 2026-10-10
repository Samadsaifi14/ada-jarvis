import { NextResponse } from 'next/server';
import { bridgeRequest } from '@/lib/bridge';

export const maxDuration = 300;

type AgentBody = {
  prompt?: unknown;
  command?: unknown;
  tool?: unknown;
  args?: unknown;
};

export async function POST(req: Request) {
  let body: AgentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { prompt, command, tool, args } = body;

  if (typeof tool === 'string' && tool.trim()) {
    if (tool.length > 100) {
      return NextResponse.json({ error: 'tool name is too long.' }, { status: 400 });
    }
    const validArgs = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
    return bridgeRequest('/execute', { body: { tool, args: validArgs } });
  }

  if (typeof command === 'string' && command.trim()) {
    if (command.length > 2000) {
      return NextResponse.json({ error: 'command is too long.' }, { status: 400 });
    }
    return bridgeRequest('/execute', { body: { command } });
  }

  if (typeof prompt === 'string' && prompt.trim()) {
    if (prompt.length > 20000) {
      return NextResponse.json({ error: 'prompt is too long.' }, { status: 400 });
    }
    return bridgeRequest('/chat', { body: { prompt } });
  }

  return NextResponse.json({ error: 'Provide a prompt, command or tool in the request body.' }, { status: 400 });
}
