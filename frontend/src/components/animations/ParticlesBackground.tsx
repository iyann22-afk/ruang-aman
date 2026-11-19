import React, { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadBasic } from '@tsparticles/basic';

export const ParticlesBackground: React.FC = () => {
  const [init, setInit] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    initParticlesEngine(async (engine) => {
      await loadBasic(engine);
    }).then(() => {
      setInit(true);
    });

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (prefersReducedMotion || !init) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-60">
      <Particles
        id="tsparticles"
        options={{
          fpsLimit: 60,
          particles: {
            number: {
              value: 28, // lightweight for mobile & performance
              density: {
                enable: true,
                width: 800,
                height: 800,
              },
            },
            color: {
              value: ['#0F9F91', '#38BDF8', '#94A3B8'],
            },
            shape: {
              type: 'circle',
            },
            opacity: {
              value: { min: 0.15, max: 0.4 },
            },
            size: {
              value: { min: 2, max: 5 },
            },
            move: {
              enable: true,
              speed: 0.8,
              direction: 'none',
              random: true,
              straight: false,
              outModes: {
                default: 'out',
              },
            },
          },
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'bubble',
              },
            },
            modes: {
              bubble: {
                distance: 120,
                size: 7,
                duration: 2,
                opacity: 0.8,
              },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
};
