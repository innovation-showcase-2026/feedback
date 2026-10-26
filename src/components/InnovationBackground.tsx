import React from 'react';
import { WFTheme } from '../theme';

interface InnovationBackgroundProps {
  variant?: 'light' | 'dark';
}

export function InnovationBackground({ variant = 'light' }: InnovationBackgroundProps) {
  const isDark = variant === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" style={{ backgroundColor: isDark ? '#0A0A0B' : WFTheme.colors.background }}>
      <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glowRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D52B1E" stopOpacity={isDark ? 0.15 : 0.08} />
            <stop offset="100%" stopColor="#D52B1E" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="glowGold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFC72C" stopOpacity={isDark ? 0.12 : 0.10} />
            <stop offset="100%" stopColor="#FFC72C" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Ambient atmospheric blobs */}
        <circle cx="20%" cy="10%" r="220" fill="url(#glowRed)" />
        <circle cx="85%" cy="85%" r="260" fill="url(#glowGold)" />

        {/* Constellation lines */}
        <g stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,11,0.05)'} strokeWidth="1">
          <line x1="15%" y1="15%" x2="45%" y2="25%" />
          <line x1="45%" y1="25%" x2="75%" y2="18%" />
          <line x1="45%" y1="25%" x2="55%" y2="45%" />
          <line x1="25%" y1="65%" x2="55%" y2="45%" />
          <line x1="55%" y1="45%" x2="80%" y2="60%" />
        </g>

        {/* Constellation dots */}
        <g fill={isDark ? 'rgba(213,43,30,0.45)' : 'rgba(213,43,30,0.3)'}>
          <circle cx="15%" cy="15%" r="3.5" />
          <circle cx="45%" cy="25%" r="4" />
          <circle cx="75%" cy="18%" r="3.5" />
          <circle cx="55%" cy="45%" r="4.5" />
          <circle cx="25%" cy="65%" r="3.5" />
          <circle cx="80%" cy="60%" r="4" />
        </g>
      </svg>
    </div>
  );
}

export function GoldDivider({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`w-full h-[1px] ${className || ''}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255, 199, 44, 0.1) 0%, rgba(255, 199, 44, 0.8) 50%, rgba(255, 199, 44, 0.1) 100%)',
        ...style,
      }}
    />
  );
}

export function Waveform({ isActive, bars = 24 }: { isActive: boolean; bars?: number }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-9">
      {Array.from({ length: bars }).map((_, i) => {
        const heightFactor = isActive ? ((i % 5) + 1) * 6 : 4;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-150"
            style={{
              height: `${heightFactor}px`,
              backgroundColor: isActive ? WFTheme.colors.red : WFTheme.colors.border,
              opacity: isActive ? 0.9 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

export function SignalViz({ size = 140, variant = 'light' }: { size?: number; variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';
  const rings = [0.45, 0.65, 0.85, 1.0];

  return (
    <div
      className="relative flex items-center justify-center my-4"
      style={{ width: size, height: size }}
    >
      {rings.map((scale, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none transition-all duration-700 animate-pulse"
          style={{
            width: size * scale,
            height: size * scale,
            border: `1.5px solid ${
              i === rings.length - 1
                ? 'rgba(213, 43, 30, 0.5)'
                : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(10, 10, 11, 0.08)'
            }`,
          }}
        />
      ))}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative z-10"
        style={{
          backgroundColor: WFTheme.colors.red,
          boxShadow: WFTheme.shadows.button,
        }}
      >
        <div className="w-3 h-3 rounded-full bg-white animate-ping" />
      </div>
    </div>
  );
}
