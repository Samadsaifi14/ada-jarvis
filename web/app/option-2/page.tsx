'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import SplineScene from '@/components/SplineScene';
import TextReveal from '@/components/TextReveal';
import WebGLCursor from '@/components/WebGLCursor';

const Option2FullRedesign = () => {
  useEffect(() => {
    // Tool cards staggered entrance
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 30 },
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

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SplineScene />

        <div style={{ margin: '32px 0' }}>
          <TextReveal text="ADA" className="text-reveal" />
          <TextReveal text="Your PC, Under One Command Surface" className="text-reveal" />
        </div>

        <div style={{ display: 'grid', gap: 24, margin: '32px 0' }}>
          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }} className="tool-card">
            <h4 style={{ color: '#10b981', marginBottom: 12 }}>Voice & Chat</h4>
            <p style={{ color: '#64748b', fontSize: 14 }}>Microphone → Whisper → local Qwen → spoken reply</p>
          </div>
          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }} className="tool-card">
            <h4 style={{ color: '#10b981', marginBottom: 12 }}>Memory & Tasks</h4>
            <p style={{ color: '#64748b', fontSize: 14 }}>Persistent SQLite memory, to-dos and schedules</p>
          </div>
          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }} className="tool-card">
            <h4 style={{ color: '#10b981', marginBottom: 12 }}>Approved Actions</h4>
            <p style={{ color: '#64748b', fontSize: 14 }}>Allow-listed apps, files, Google, GitHub and more</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f2b36', padding: '24px 0', margin: '32px 0' }}>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Restrained motion into tool pages · Consistent visual identity · Full 3D across homepage and tools
          </p>
        </div>
      </div>
    </main>
  );
};

export default Option2FullRedesign;