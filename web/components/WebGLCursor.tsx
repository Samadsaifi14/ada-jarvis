'use client';

import { useEffect, useRef } from 'react';

const WebGLCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    cursor.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: difference;
      transition: opacity 0.2s;
    `;

    let mouseX = 0,
      mouseY = 0,
      cursorX = 0,
      cursorY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const animate = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      requestAnimationFrame(animate);
    };

    animate();

    // Hide over interactive elements
    const interactive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];

    const onMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (interactive.includes(target.tagName)) {
        cursor.style.opacity = '0';
      }
    };

    const onMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (interactive.includes(target.tagName)) {
        cursor.style.opacity = '1';
      }
    };

    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
    };
  }, []);

  return <div ref={cursorRef} style={{ position: 'fixed', width: '8px', height: '8px', background: 'none', pointerEvents: 'none', zIndex: 9999 }} />;
};

export default WebGLCursor;