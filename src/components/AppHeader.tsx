import React from 'react';
import { GoldDivider } from './InnovationBackground';
import { WFTheme } from '../theme';

interface AppHeaderProps {
  anchorName?: string;
  sessionId?: string;
  variant?: 'dark' | 'light';
}

export function AppHeader({ anchorName, sessionId }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E8EA]">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Brand Badge */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center relative shadow-sm"
            style={{ backgroundColor: WFTheme.colors.red }}
          >
            <span className="text-white font-extrabold text-sm tracking-tight">WF</span>
            <div
              className="absolute bottom-1 left-1 right-1 h-0.5 rounded-full"
              style={{ backgroundColor: WFTheme.colors.gold }}
            />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#6B6B70] uppercase tracking-wider">
              Technology Innovation Summit
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#1A1A1C]">2026</span>
              <span className="text-[11px] font-bold tracking-wider" style={{ color: WFTheme.colors.goldDeep }}>
                VOICE → INSIGHT
              </span>
            </div>
          </div>
        </div>

        {/* Right: Anchor metadata */}
        {anchorName ? (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-[#6B6B70] uppercase tracking-wider">
              Anchor
            </span>
            <span className="text-xs font-bold text-[#1A1A1C] truncate max-w-[120px]">
              {anchorName}
            </span>
            {sessionId ? (
              <span className="text-[10px] font-mono text-[#9A9A9F]">
                {sessionId}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <GoldDivider />
    </header>
  );
}
