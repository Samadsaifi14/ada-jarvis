'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import SplineScene from '@/components/SplineScene';
import TextReveal from '@/components/TextReveal';
import WebGLCursor from '@/components/WebGLCursor';

const Option3ScientificStorytelling = () => {
  useEffect(() => {
    // Story progression animation
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.story-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.5,
      },
    });

    timeline
      .from('.bio-input', { y: 20, opacity: 0, duration: 0.6 })
      .from('.analysis-section', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
      .from('.evidence-section', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3');

    // Panel scroll triggers
    gsap.from('.input-card', {
      opacity: 0,
      x: -30,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.input-card',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play reverse play reverse',
      },
    });

    gsap.from('.results-card', {
      opacity: 0,
      x: 30,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.results-card',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play reverse play reverse',
      },
    });

    // Cursor feedback on scientific elements
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('evidence-item')) {
        gsap.to(target, { boxShadow: '0 0 20px #10b981', duration: 0.3 });
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('evidence-item')) {
        gsap.to(target, { boxShadow: 'none', duration: 0.3 });
      }
    });
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '32px 20px' }}>
      <WebGLCursor />

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SplineScene />

        <div style={{ margin: '32px 0' }}>
          <TextReveal text="BioNexus" className="text-reveal" />
          <TextReveal text="From Biological Input → Analysis → Interpretable Evidence" className="text-reveal" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, margin: '32px 0' }}>
          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }}>
            <h3 style={{ color: '#10b981', marginBottom: 16 }}>Biological Input</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Scroll through molecular data visualization. The scene responds to your position, revealing different protein structures and biological pathways.
            </p>
            <ul style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <li>DNA sequencing data</li>
              <li>Protein structure arrays</li>
              <li>Cellular pathway maps</li>
            </ul>
          </div>

          <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24 }}>
            <h3 style={{ color: '#10b981', marginBottom: 16 }}>Analysis</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Interactive analysis of biological findings with scroll-driven transitions between data perspectives.
            </p>
            <ul style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <li>Statistical validation</li>
              <li>Comparative analysis</li>
              <li>Pattern recognition</li>
            </ul>
          </div>
        </div>

        <div style={{ background: '#131a21', border: '1px solid #1f2b36', borderRadius: 8, padding: 24, margin: '32px 0' }}>
          <h3 style={{ color: '#10b981', marginBottom: 16 }}>Interpretable Evidence</h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Final evidence presentation with restrained motion, clear typography, and accessible design. Results are presented clearly for practical research workflows.
          </p>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <strong>Confidence:</strong> 94.2%<br />
              <strong>Sources:</strong> 12 peer-reviewed studies<br />
              <strong>Last updated:</strong> 2024-01-15
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              <strong>Method:</strong> Maximum likelihood estimation<br />
              <strong>Significance:</strong> p is less than 0.001...<br />
              <strong>Reproducibility:</strong> High
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f2b36', padding: '24px 0', margin: '32px 0' }}>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            Reduced-motion support · Soft scientific color palette · Accessible typography · Lightweight mobile fallbacks
          </p>
        </div>
      </div>
    </main>
  );
};

export default Option3ScientificStorytelling;