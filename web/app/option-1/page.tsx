'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import SplineScene from '@/components/SplineScene';
import TextReveal from '@/components/TextReveal';
import WebGLCursor from '@/components/WebGLCursor';

const Option1ImmersiveLanding = () => {
  useEffect(() => {
    // Text reveals - animate after mount
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
    <main style={{ minHeight: '100vh', padding: '32px 20px' }}>
      <WebGLCursor />

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SplineScene />

        <div style={{ margin: '32px 0' }}>
          <TextReveal text="BioNexus" className="text-reveal" />
          <TextReveal text="Molecular Analysis Platform" className="text-reveal" />
        </div>

        <p style={{
          color: '#64748b',
          fontSize: 14,
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          Scroll through the molecular scene to explore biological data visualization.<br />
          <span style={{ color: '#10b981' }}>🌀</span> Scroll-driven camera transitions
        </p>

        <div style={{ borderTop: '1px solid #1f2b36', padding: '24px 0', margin: '32px 0' }}>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Soft scientific colors · Accessible text · Reduced-motion support available
          </p>
        </div>
      </div>
    </main>
  );
};

export default Option1ImmersiveLanding;