'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

type Mode = 'prompt' | 'command';
type Approval = { id: string; action: string; args: Record<string, unknown>; created_at: string };

const shell: CSSProperties = {
  border: '1px solid #1f2b36',
  background: '#0f151b',
  padding: 16,
  borderRadius: 6,
};

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('prompt');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState('');
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const refreshApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/approvals?status=pending', { cache: 'no-store' });
      const data = await res.json();
      setApprovals(Array.isArray(data.result) ? data.result : []);
    } catch {
      setApprovals([]);
    }
  }, []);

  useEffect(() => {
    refreshApprovals();
    const timer = setInterval(refreshApprovals, 15000);
    return () => clearInterval(timer);
  }, [refreshApprovals]);

  async function send() {
    if (!input.trim() || busy) return;
    setBusy(true);
    setOutput('…');
    try {
      const body = mode === 'prompt' ? { prompt: input } : { command: input };
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
      if (data.result?.pending_approvals?.length) refreshApprovals();
    } catch (err) {
      setOutput(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, approved: boolean) {
    const res = await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved }),
    });
    const data = await res.json();
    setOutput(JSON.stringify(data, null, 2));
    refreshApprovals();
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, letterSpacing: 2, color: '#4ade80', margin: 0 }}>ADA // COMMAND CENTER</h1>
        <span style={{ fontSize: 12, color: '#5b6b7a' }}>hybrid bridge · vercel → tunnel → local ADA</span>
      </header>

      <section style={{ ...shell, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['prompt', 'command'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                background: mode === m ? '#14532d' : '#131a21',
                color: mode === m ? '#bbf7d0' : '#8296a8',
                border: '1px solid #1f2b36',
                borderRadius: 4,
                padding: '6px 14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                textTransform: 'uppercase',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
          }}
          rows={4}
          placeholder={mode === 'prompt' ? 'Ask ADA anything…' : 'Allow-listed command, e.g. git status'}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#0a0e12',
            color: '#d7e0e8',
            border: '1px solid #1f2b36',
            borderRadius: 4,
            padding: 10,
            fontFamily: 'inherit',
            fontSize: 14,
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: '#5b6b7a' }}>
            commands run through ADA&apos;s SAFE/ASK/BLOCK policy — risky actions need approval
          </span>
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            style={{
              background: busy ? '#14532d' : '#16a34a',
              color: '#052e16',
              border: 'none',
              borderRadius: 4,
              padding: '8px 20px',
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontWeight: 700,
            }}
          >
            {busy ? 'RUNNING' : 'EXECUTE'}
          </button>
        </div>
      </section>

      <section style={{ ...shell, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#5b6b7a', marginBottom: 8 }}>OUTPUT</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, color: '#9fd8ff' }}>{output || '—'}</pre>
      </section>

      <section style={shell}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: '#5b6b7a' }}>PENDING APPROVALS</span>
          <button
            onClick={refreshApprovals}
            style={{ background: 'transparent', color: '#8296a8', border: '1px solid #1f2b36', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}
          >
            REFRESH
          </button>
        </div>
        {approvals.length === 0 ? (
          <div style={{ fontSize: 13, color: '#5b6b7a' }}>Nothing waiting.</div>
        ) : (
          approvals.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: '1px solid #1f2b36' }}>
              <div style={{ fontSize: 13 }}>
                <strong style={{ color: '#fbbf24' }}>{a.action}</strong>{' '}
                <span style={{ color: '#8296a8' }}>{JSON.stringify(a.args)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => decide(a.id, true)} style={{ background: '#16a34a', color: '#052e16', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
                  APPROVE
                </button>
                <button onClick={() => decide(a.id, false)} style={{ background: '#7f1d1d', color: '#fecaca', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
                  REJECT
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
