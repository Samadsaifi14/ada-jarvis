'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { gsap } from 'gsap';
import SplineScene from '@/components/SplineScene';
import TextReveal from '@/components/TextReveal';
import WebGLCursor from '@/components/WebGLCursor';

const navLink: CSSProperties = {
  color: '#8296a8',
  textDecoration: 'none',
  marginRight: 24,
  fontSize: 12,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: 1,
  transition: 'color 0.2s',
};

const ImmersiveLanding = () => {
  useEffect(() => {
    const reveals = document.querySelectorAll('.text-reveal');
    reveals.forEach((reveal, index) => {
      gsap.fromTo(
        reveal.firstElementChild,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.3 + index * 0.1,
        }
      );
    });
  }, []);

  return (
    <main style={{ minHeight: '100vh' }}>
      <WebGLCursor />

      <nav style={{
        position: 'fixed',
        top: 24,
        left: 24,
        zIndex: '1000',
        background: '#0f151b',
        border: '1px solid #1f2b36',
        borderRadius: 8,
        padding: '12px 20px',
      }}>
        <a href="/option-2" style={navLink}>Full Redesign</a>
        <a href="/command" style={navLink}>Command Center</a>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
        <SplineScene />

        <div style={{ margin: '32px 0' }}>
          <TextReveal text="ADA" className="text-reveal" />
          <TextReveal text="Local-First Personal Operating Agent" className="text-reveal" />
        </div>

        <p style={{
          color: '#64748b',
          fontSize: 14,
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          Scroll through the interface that connects voice, memory and Windows actions.<br />
          <span style={{ color: '#10b981' }}>◆</span> Local reasoning, approved actions
        </p>

        <div style={{ borderTop: '1px solid #1f2b36', padding: '24px 0', margin: '32px 0' }}>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Local-first · SAFE / ASK / BLOCK policy · Accessible, reduced-motion support
          </p>
        </div>
      </div>
    </main>
  );
};

export default ImmersiveLanding;