import React, { useEffect, useState } from 'react';

// Import web component for dotlottie
import '@lottiefiles/dotlottie-wc';

interface LottieHeroProps {
  className?: string;
}

export const LottieHero: React.FC<LottieHeroProps> = ({ className = '' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if custom elements is supported
    if (!window.customElements) {
      setHasError(true);
    }
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {!hasError ? (
        <div className="w-full h-full max-w-[380px] max-h-[380px] flex items-center justify-center">
          {/* dotlottie web component */}
          {/* @ts-ignore */}
          <dotlottie-wc
            src="https://lottie.host/8e31a19f-4ee6-48ec-99e2-45e3f41dc73d/kF63N0uB82.lottie"
            autoplay
            loop
            style={{ width: '100%', height: '100%' }}
            onError={() => setHasError(true)}
          />
        </div>
      ) : null}

      {/* Empathetic High-Fidelity Vector Fallback if offline or lottie fails */}
      {hasError && (
        <div className="w-full h-full max-w-[340px] max-h-[340px] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="relative w-44 h-44 mb-3">
            {/* Soft pulsing aura */}
            <div className="absolute inset-0 rounded-full bg-[#CCFBF1] opacity-70 blur-xl animate-pulse"></div>

            {/* Caring Safe Shield & Heart SVG */}
            <svg
              className="relative w-full h-full drop-shadow-md text-[#0F9F91]"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M60 12L96 26C96 66 60 98 60 98C60 98 24 66 24 26L60 12Z"
                fill="#E0F2FE"
                stroke="#0F9F91"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                d="M60 25L84 35C84 65 60 88 60 88C60 88 36 65 36 35L60 25Z"
                fill="#CCFBF1"
                opacity="0.6"
              />
              <path
                d="M60 42C54 36 44 38 41 46C38 54 45 64 60 74C75 64 82 54 79 46C76 38 66 36 60 42Z"
                fill="#0F9F91"
              />
              {/* Supporting caring hands icon */}
              <circle cx="48" cy="85" r="4" fill="#17324D" opacity="0.3" />
              <circle cx="60" cy="87" r="4" fill="#17324D" opacity="0.3" />
              <circle cx="72" cy="85" r="4" fill="#17324D" opacity="0.3" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#17324D]">Ruang Perlindungan Siswa</p>
          <p className="text-xs text-slate-500 mt-1">
            Setiap suara Anda berharga, didengar, dan dilindungi secara rahasia.
          </p>
        </div>
      )}
    </div>
  );
};
