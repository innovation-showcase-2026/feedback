import React from 'react';
import type { ProcessingStage } from '../types';
import { CheckIcon } from '../components/icons';
import { InnovationBackground, SignalViz } from '../components/InnovationBackground';
import { WFTheme } from '../theme';

interface ProcessingScreenProps {
  stages: ProcessingStage[];
  title?: string;
}

export function ProcessingScreen({ stages, title = 'Analyzing Visitor Feedback' }: ProcessingScreenProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1C] relative flex flex-col justify-center items-center px-6 py-12">
      <InnovationBackground variant="light" />

      <div className="max-w-md w-full flex flex-col items-center">
        {/* Center Signal */}
        <div className="flex flex-col items-center mb-6">
          <SignalViz size={160} variant="light" />
          <h1 className="text-2xl font-extrabold text-[#1A1A1C] text-center tracking-tight mt-3">
            {title}
          </h1>

          {/* Flow labels */}
          <div className="flex items-center gap-1.5 mt-3">
            {['VOICE', 'UNDERSTANDING', 'INSIGHT', 'EVIDENCE'].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <span className="text-[10px] text-[#C4C4C8]">→</span>}
                <span
                  className="text-[10px] font-bold tracking-wider"
                  style={{
                    color:
                      i <= 1
                        ? WFTheme.colors.red
                        : i === 2
                        ? WFTheme.colors.goldDeep
                        : WFTheme.colors.textMuted,
                  }}
                >
                  {label}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Stages Card */}
        <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8EA] space-y-2">
          {stages.map((stage, index) => {
            const isComplete = stage.status === 'complete';
            const isActive = stage.status === 'active';

            return (
              <div
                key={index}
                className={`flex items-center p-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#FEF2F2] border border-[#F8C5C5]'
                    : isComplete
                    ? 'bg-white'
                    : 'bg-[#FAF9F7]'
                }`}
              >
                <div className="w-6 flex items-center justify-center mr-3">
                  {isComplete ? (
                    <div className="w-5 h-5 rounded-full bg-[#D52B1E] flex items-center justify-center text-white">
                      <CheckIcon size={12} color="#FFFFFF" />
                    </div>
                  ) : isActive ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#D52B1E] border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#E8E8EA]" />
                  )}
                </div>

                <span
                  className={`flex-1 text-sm ${
                    isComplete
                      ? 'font-bold text-[#1A1A1C]'
                      : isActive
                      ? 'font-extrabold text-[#D52B1E]'
                      : 'font-medium text-[#9A9A9F]'
                  }`}
                >
                  {stage.label}
                </span>

                {isActive ? (
                  <span className="text-[#D52B1E] text-xs animate-ping">●</span>
                ) : isComplete ? (
                  <span className="text-[#D4A017] text-xs font-extrabold">✓</span>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-[#9A9A9F] mt-6 tracking-wide font-medium">
          Processing with Wells Fargo AI
        </p>
      </div>
    </div>
  );
}
