'use client';

import { useEffect, useRef } from 'react';

const SplineScene: React.FC = () => {
  const splineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!splineRef.current) return;

    // Initialize Spline scene placeholder
    // In production, replace the div with actual Spline embed
    const scene = splineRef.current;

    // Markers for GSAP animations to target
    scene.style.opacity = '0';
    scene.style.transition = 'opacity 1.5s ease';

    // Trigger in view animation (will be triggered by intersection observer)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          scene.style.opacity = '1';
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (scene) observer.observe(scene);
  }, []);

  return (
    <div
      ref={splineRef}
      style={{
        width: '100%',
        height: '100vh',
        background: '#0a0e12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
        Spline scene will load here{' '}
        <span style={{ color: '#10b981' }}>🌀</span>
      </p>
    </div>
  );
};

export default SplineScene;