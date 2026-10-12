'use client';

import { useEffect, useRef } from 'react';

const WebGLCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const innerCursorRef = useRef<HTMLDivElement>(null);
  const outerCursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursorRef.current) return;

    const cursor = cursorRef.current;
    const style = cursor.style;

    // Create inner and outer cursor elements if they don't exist
    let inner = innerCursorRef.current;
    let outer = outerCursorRef.current;

    if (!inner) {
      inner = document.createElement('div');
      inner.style.width = '8px';
      inner.style.height = '8px';
      inner.style.background = '#10b981';
      inner.style.borderRadius = '50%';
      inner.style.position = 'fixed';
      inner.style.pointerEvents = 'none';
      inner.style.zIndex = '9999';
      inner.style.mixBlendMode = 'difference';
      document.body.appendChild(inner);
      innerCursorRef.current = inner;
    }

    if (!outer) {
      outer = document.createElement('div');
      outer.style.width = '40px';
      outer.style.height = '40px';
      outer.style.border = '2px solid #10b981';
      outer.style.borderRadius = '50%';
      outer.style.position = 'fixed';
      outer.style.pointerEvents = 'none';
      outer.style.zIndex = '9999';
      outer.style.opacity = '0.6';
      document.body.appendChild(outer);
      outerCursorRef.current = outer;
    }

    document.addEventListener('mousemove', (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    });

    const animate = () => {
      const { x, y } = mouseRef.current;

      // Smooth follow with slight lag for outer cursor
      gsap.to(outer, {
        x: x - 20,
        y: y - 20,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Inner cursor follows more closely
      gsap.to(inner, {
        x: x - 4,
        y: y - 4,
        duration: 0.1,
        ease: 'power1.out',
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Hide custom cursor over interactive elements
    const interactiveElements = [
      'a',
      'button',
      'input',
      'select',
      'textarea',
    ];

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (interactiveElements.includes(target.tagName.toLowerCase())) {
        gsap.to(outer, { opacity: 0, duration: 0.2 });
        gsap.to(inner, { opacity: 0, duration: 0.2 });
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (interactiveElements.includes(target.tagName.toLowerCase())) {
        gsap.to(outer, { opacity: 0.6, duration: 0.3 });
        gsap.to(inner, { opacity: 1, duration: 0.3 });
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
      if (inner.parentNode) inner.parentNode.removeChild(inner);
      if (outer.parentNode) outer.parentNode.removeChild(outer);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        width: '8px',
        height: '8px',
        background: 'none',
        pointerEvents: 'none',
        zIndex: '9999',
      }}
    />
  );
};

export default WebGLCursor;