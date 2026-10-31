import React, { useState } from 'react';
import { APP_CONFIG } from '../config';
import { ArrowRightIcon, UserIcon } from '../components/icons';
import { InnovationBackground, GoldDivider } from '../components/InnovationBackground';
import { WFTheme } from '../theme';

interface WelcomeScreenProps {
  onStart: (name: string) => void;
  onSubmitFeedback?: (name: string, text: string) => void;
}

export function WelcomeScreen({ onStart, onSubmitFeedback }: WelcomeScreenProps) {
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('tis_anchor_name') || '';
    }
    return '';
  });
  const [feedbackText, setFeedbackText] = useState('');

  const trimmedName = name.trim();
  const trimmedFeedback = feedbackText.trim();
  const hasFeedback = trimmedFeedback.length >= 3;

  const handleStartVoice = () => {
    onStart(trimmedName || 'Booth Anchor');
  };

  const handleSubmitFeedback = () => {
    if (hasFeedback && onSubmitFeedback) {
      onSubmitFeedback(trimmedName || 'Booth Anchor', trimmedFeedback);
    } else {
      handleStartVoice();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1C] relative flex flex-col justify-between">
      <InnovationBackground variant="light" />

      <main className="max-w-xl mx-auto w-full px-5 py-8 flex-1 flex flex-col justify-center">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: WFTheme.colors.red }} />
          <span className="text-[11px] font-bold text-[#6B6B70] uppercase tracking-widest">
            Technology Innovation Summit 2026
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1C] tracking-tight leading-tight mb-2">
          Your Conversation <br />
          Can Shape <span style={{ color: WFTheme.colors.red }}>What's Next.</span>
        </h1>

        <p className="text-sm text-[#4A4A50] leading-relaxed mb-6">
          Capture what visitors think. Speak or type below to transform conversations into actionable innovation insights.
        </p>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-6 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-[#E8E8EA]">
          {['VOICE / TEXT', 'AI INSIGHT', 'ACTION'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0
                    ? 'bg-[#FEF2F2] text-[#D52B1E] border border-[#F8C5C5]'
                    : i === 1
                    ? 'bg-[#FFFDF5] text-[#D4A017] border border-[#FFEBA8]'
                    : 'bg-[#F0F0F2] text-[#6B6B70]'
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs font-semibold text-[#4A4A50] hidden sm:inline">{step}</span>
            </div>
          ))}
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E8EA] mb-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1A1A1C] uppercase tracking-wider mb-2">
              Booth Anchor / Interviewer
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('tis_anchor_name', e.target.value.trim());
                  }
                }}
                placeholder="e.g., Alex Johnson"
                className="w-full pl-10 pr-4 py-3 bg-[#FAF9F7] rounded-xl border border-[#E8E8EA] text-sm text-[#1A1A1C] placeholder-[#9A9A9F] focus:outline-none focus:border-[#D52B1E] transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9F]">
                <UserIcon size={18} />
              </div>
            </div>
          </div>

          <GoldDivider />

          {/* Feedback Text Input Option */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#1A1A1C] uppercase tracking-wider">
                Direct Feedback Notes <span className="text-[11px] font-normal text-[#9A9A9F] lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-[#6B6B70]">Type or speak</span>
            </div>
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type customer or visitor thoughts directly here, or start conversation below..."
              className="w-full p-3 bg-[#FAF9F7] rounded-xl border border-[#E8E8EA] text-sm text-[#1A1A1C] placeholder-[#9A9A9F] focus:outline-none focus:border-[#D52B1E] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            {hasFeedback ? (
              <button
                type="button"
                onClick={handleSubmitFeedback}
                className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${WFTheme.colors.redBright} 0%, ${WFTheme.colors.redDeep} 100%)`,
                  boxShadow: WFTheme.shadows.button,
                }}
              >
                <span>Analyze & Save Feedback</span>
                <ArrowRightIcon size={18} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartVoice}
                  className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                  style={{
                    background: `linear-gradient(135deg, ${WFTheme.colors.redBright} 0%, ${WFTheme.colors.redDeep} 100%)`,
                    boxShadow: WFTheme.shadows.button,
                  }}
                >
                  <span>Start Conversation Recording</span>
                  <ArrowRightIcon size={18} />
                </button>
                <p className="text-center text-[11px] text-[#9A9A9F] mt-1">
                  Or type your feedback notes above to analyze immediately.
                </p>
              </>
            )}
          </div>
        </div>

        <footer className="text-center text-[11px] text-[#9A9A9F] mt-4 font-medium">
          {APP_CONFIG.summitTitle}
        </footer>
      </main>
    </div>
  );
}

export default WelcomeScreen;
