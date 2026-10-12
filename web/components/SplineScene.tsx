'use client';

import { useEffect, useRef } from 'react';

const SplineScene: React.FC = () => {
  const splineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!splineRef.current) return;

    const scene = splineRef.current;
    scene.style.opacity = '1';

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
        color: '#d7e0e8',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      }}
    >
      <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
        ADA control plane{' '}
        <span style={{ color: '#10b981' }}>◆</span>
      </p>
    </div>
  );
};

export default SplineScene;