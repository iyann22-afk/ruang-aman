import React, { useEffect, useRef } from 'react';
import VanillaTilt, { TiltVanillaElement } from 'vanilla-tilt';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  maxTilt = 7, // 6-8 degrees soft 3D effect
  className = '',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current as TiltVanillaElement | null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (el && !prefersReducedMotion) {
      VanillaTilt.init(el, {
        max: maxTilt,
        speed: 400,
        glare: true,
        'max-glare': 0.15,
        scale: 1.02,
        perspective: 1000,
      });
    }

    return () => {
      if (el && el.vanillaTilt) {
        el.vanillaTilt.destroy();
      }
    };
  }, [maxTilt]);

  return (
    <div ref={cardRef} className={`transform-gpu ${className}`} {...props}>
      {children}
    </div>
  );
};
