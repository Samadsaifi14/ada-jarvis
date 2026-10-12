'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import SplineScene from '@/components/SplineScene';
import TextReveal from '@/components/TextReveal';
import WebGLCursor from '@/components/WebGLCursor';

const Option1ImmersiveLanding = () => {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP scene entrance animation
    gsap.from('.spline-scene', {
      y: 20,
      opacity: 0,
      duration: 1.5,
      ease: 'power2.out',
      delay: 0.5,
    });

    // Text reveals
    gsap.from('.text-reveal', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out',
      delay: 1,
    });

    // Cursor pulse effect
    gsap.to('.cursor-pulse', {
      opacity: 0.5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
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
          <span style={{ color: '#10b981' }}>🌀</span> Scroll-driven camera transitions{'          '}
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