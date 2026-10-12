'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import SplineScene from '@/components/SplineScene';
import TextReveal from '@/components/TextReveal';
import WebGLCursor from '@/components/WebGLCursor';

const Option2FullRedesign = () => {
  useEffect(() => {
    // Full scene entrance with staggered delays
    gsap.from('.scene-container', {
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.3,
    });

    gsap.from('.tool-card', {
      opacity: 0,
      x: -50,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      delay: 0.8,
    });

    // Parallax effect on scroll
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      gsap.to('.spline-camera', {
        y: -scrollY * 0.2,
        duration: 0.5,
        ease: 'power2.out',
      });
    });

    return () => window.removeEventListener('scroll', () => {});
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px' }}>
      <WebGLCursor />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SplineScene />

        <div style={{ margin: '32px 0' }}>
          <TextReveal text="BioNexus" className="text-reveal" />
          <TextReveal text="Complete Scientific Workflow" className="text-reveal" />
        </div>

        <div style={{ display: 'grid', gap: 24, margin: '32px 0' }}>
          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }}>
            <h4 style={{ color: '#10b981', marginBottom: 12 }}>Molecular Visualization</h4>
            <p style={{ color: '#64748b', fontSize: 14 }}>Interactive 3D molecular structures with scroll-driven camera moves</p>
          </div>
          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }}>
            <h4 style={{ color: '#10b981', marginBottom: 12 }}>Data Analysis</h4>
            <p style={{ color: '#64748b', fontSize: 14 }}>Scroll-driven charts and graphs with GSAP reveals</p>
          </div>
          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }}>
            <h4 style={{ color: '#10b981', marginBottom: 12 }}>Evidence Gallery</h4>
            <p style={{ color: '#64748b', fontSize: 14 }}>Curated research evidence with interactive filtering</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f2b36', padding: '24px 0', margin: '32px 0' }}>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Restrained motion into tool pages, Consistent visual identity, Full 3D across homepage and tools
          </p>
        </div>
      </div>
    </main>
  );
};

export default Option2FullRedesign;