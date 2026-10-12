'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import SplineScene from '@/components/SplineScene';
import TextReveal from '@/components/TextReveal';
import WebGLCursor from '@/components/WebGLCursor';

const Option3Storyflow = () => {
  useEffect(() => {
    // Panels fade-in on load
    const panels = document.querySelectorAll('.story-panel');
    panels.forEach((panel, index) => {
      gsap.fromTo(
        panel,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.1 * index,
        }
      );
    });
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px' }}>
      <WebGLCursor />

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SplineScene />

        <div style={{ margin: '32px 0' }}>
          <TextReveal text="ADA" className="text-reveal" />
          <TextReveal text="From Voice Input → Local Reasoning → Approved Action" className="text-reveal" />
        </div>

        <div style={{ display: 'grid', gap: 32, margin: '32px 0' }}>
          <div className="story-panel" style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }}>
            <h3 style={{ color: '#10b981', marginBottom: 16 }}>Voice Input</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Speak or type. ADA transcribes on-device and keeps everything local.
            </p>
            <ul style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <li>Microphone → faster-whisper</li>
              <li>CLI, web and phone entry points</li>
              <li>No audio leaves your machine</li>
            </ul>
          </div>

          <div className="story-panel" style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }}>
            <h3 style={{ color: '#10b981', marginBottom: 16 }}>Local Reasoning</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Ollama + Qwen plan the response with tools, memory and context.
            </p>
            <ul style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <li>Tool-calling loop</li>
              <li>Memory and task context</li>
              <li>Runs entirely on your PC</li>
            </ul>
          </div>
        </div>

        <div className="story-panel" style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24, margin: '32px 0' }}>
          <h3 style={{ color: '#10b981', marginBottom: 16 }}>Approved Action</h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Every tool call passes a risk policy and audit log before it runs.
          </p>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <strong>Policy:</strong> SAFE / ASK / BLOCK<br />
              <strong>Audit:</strong> Every event logged<br />
              <strong>Secrets:</strong> Local only
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <strong>Integrations:</strong> Google, GitHub, Windows<br />
              <strong>Voice out:</strong> Piper TTS<br />
              <strong>Approval:</strong> Risky actions gated
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f2b36', padding: '24px 0', margin: '32px 0' }}>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Reduced-motion support · Local-first palette · Accessible typography · Lightweight mobile fallbacks
          </p>
        </div>
      </div>
    </main>
  );
};

export default Option3Storyflow;