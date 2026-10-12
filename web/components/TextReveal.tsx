'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const TextReveal: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    element.innerHTML = '';

    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    textSpan.style.display = 'inline-block';
    element.appendChild(textSpan);

    // GSAP animation runs after mount
    gsap.fromTo(
      textSpan,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        delay: 0.3,
      }
    );

    if (className) {
      ;(element as HTMLElement).classList.add(className);
    }
  }, [text, className]);

  return <div ref={elementRef} className={className} />;
};

export default TextReveal;