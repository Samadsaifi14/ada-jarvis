'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

type Mode = 'prompt' | 'command';
type Approval = { id: string; action: string; args: Record<string, unknown>; created_at: string };

type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; 0: SpeechAlternative };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  abort(): void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return anyWindow.SpeechRecognition ?? anyWindow.webkitSpeechRecognition ?? null;
}

const VOICE_PREFERENCES: RegExp[] = [
  /Google UK English Female/,
  /Google UK English Male/,
  /Google US English/,
  /Microsoft (Amara|Aria|David|Emma|George|Guy|Jenny|Sonia|Zira)/i,
];

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.startsWith('en') && VOICE_PREFERENCES.some((r) => r.test(voice.name))) ??
    voices.find((voice) => voice.lang.startsWith('en')) ??
    null
  );
}

function splitSentences(text: string, maxChunk = 180): string[] {
  const parts = text.replace(/\s+/g, ' ').match(/[^.!?\n]+[.!?]*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current && current.length + part.length > maxChunk) {
      chunks.push(current.trim());
      current = part;
    } else {
      current += part;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

const AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/webm',
  'audio/ogg',
];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

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
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speakSessionRef = useRef(0);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(
    () => () => {
      speakSessionRef.current += 1;
      recognitionRef.current?.abort();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    []
  );

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

  function stopSpeaking() {
    speakSessionRef.current += 1;
    setSpeaking(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function speak(text: string) {
    if (!('speechSynthesis' in window) || !text.trim() || !autoSpeak) return;
    const session = ++speakSessionRef.current;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const chunks = splitSentences(text);
    setSpeaking(true);
    let index = 0;
    const speakNext = () => {
      if (session !== speakSessionRef.current || index >= chunks.length) {
        setSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? 'en-US';
      utterance.onend = () => speakNext();
      utterance.onerror = () => speakNext();
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
  }

  function playResponse(text?: string) {
    if (!autoSpeak || !text?.trim() || !('speechSynthesis' in window)) return;
    speak(text);
  }

  async function send(messageOverride?: string) {
    const message = (messageOverride ?? input).trim();
    if (!message || busy) return;
    setBusy(true);
    setOutput('…');
    try {
      const body = mode === 'prompt' ? { prompt: message } : { command: message };
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
      const reply = typeof data?.result?.text === 'string' ? data.result.text : undefined;
      if (reply) {
        playResponse(reply);
      } else if (data?.error) {
        playResponse(`ADA says: ${data.error}`);
      }
      if (data.result?.pending_approvals?.length) refreshApprovals();
    } catch (err) {
      setOutput(String(err));
      playResponse('ADA is unavailable right now.');
    } finally {
      setBusy(false);
    }
  }

  function startWebSpeech(Recognizer: new () => SpeechRecognitionLike) {
    const rec = new Recognizer();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    let finalTranscript = '';
    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0].transcript;
        if (result.isFinal) finalTranscript += chunk;
        else interim += chunk;
      }
      setInput(finalTranscript + interim);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (finalTranscript.trim()) send(finalTranscript);
    };
    rec.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function startRecording() {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSpeechError('No microphone recording API is available in this browser.');
      return;
    }
    setSpeechError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = AUDIO_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        if (!blob.size) {
          setSpeechError('No audio was captured.');
          return;
        }
        setBusy(true);
        setOutput('Transcribing with local Whisper…');
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch('/api/speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mime: blob.type }),
          });
          const data = await res.json();
          const text = typeof data?.result?.text === 'string' ? data.result.text.trim() : '';
          if (text) {
            setInput(text);
            send(text);
          } else {
            setOutput(JSON.stringify(data, null, 2));
            setSpeechError(typeof data?.result?.error === 'string' ? data.result.error : data?.error || 'Transcription failed.');
          }
        } catch (err) {
          setOutput(String(err));
          setSpeechError('Transcription request failed.');
        } finally {
          setBusy(false);
        }
      };
      recorder.onerror = () => {
        setRecording(false);
        mediaRecorderRef.current = null;
        setSpeechError('Microphone recording failed.');
      };
      recorder.start();
      setRecording(true);
    } catch {
      setSpeechError('Microphone access was denied or unavailable.');
    }
  }

  function toggleListen() {
    if (recording) {
      stopRecording();
      return;
    }
    if (listening) {
      recognitionRef.current?.abort();
      return;
    }
    const Recognizer = getSpeechRecognition();
    if (Recognizer) {
      startWebSpeech(Recognizer);
      return;
    }
    startRecording();
  }

  function toggleSpeak() {
    if (autoSpeak) {
      stopSpeaking();
      setAutoSpeak(false);
    } else {
      setAutoSpeak(true);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 10 }}>
          <button
            onClick={toggleListen}
            disabled={busy}
            style={{
              background: listening || recording ? '#7f1d1d' : '#131a21',
              color: listening || recording ? '#fecaca' : '#8296a8',
              border: '1px solid #1f2b36',
              borderRadius: 4,
              padding: '6px 14px',
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              textTransform: 'uppercase',
            }}
          >
            {recording ? 'Stop Rec' : listening ? 'Stop Mic' : 'Mic'}
          </button>
          <button
            onClick={toggleSpeak}
            style={{
              background: autoSpeak ? '#14532d' : '#131a21',
              color: autoSpeak ? '#bbf7d0' : '#8296a8',
              border: '1px solid #1f2b36',
              borderRadius: 4,
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              textTransform: 'uppercase',
            }}
          >
            Speak {autoSpeak ? 'On' : 'Off'}
          </button>
          {speaking && <span style={{ fontSize: 11, color: '#4ade80' }}>Talking…</span>}
          <span style={{ fontSize: 11, color: '#5b6b7a' }}>
            {recording
              ? 'Recording — press again to stop and transcribe'
              : listening
                ? 'Listening — speak now'
                : 'Mic uses browser speech, or local Whisper when unsupported'}
          </span>
        </div>
        {speechError && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>{speechError}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: '#5b6b7a' }}>
            commands run through ADA&apos;s SAFE/ASK/BLOCK policy — risky actions need approval
          </span>
          <button
            onClick={() => send()}
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
