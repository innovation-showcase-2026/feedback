import React from 'react';
import type { FirebaseSubmitResult } from '../types';
import { CheckIcon, ArrowRightIcon } from '../components/icons';
import { InnovationBackground, GoldDivider } from '../components/InnovationBackground';
import { WFTheme } from '../theme';

interface SuccessScreenProps {
  sessionId: string;
  anchorName: string;
  submitResult: FirebaseSubmitResult | null;
  onStartNew: () => void;
}

export function SuccessScreen({ sessionId, anchorName, submitResult, onStartNew }: SuccessScreenProps) {
  const collectionName = submitResult?.collectionName || 'feedback';
  const documentId = submitResult?.documentId || sessionId;

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1C] relative flex flex-col justify-between">
      <InnovationBackground variant="light" />

      <main className="max-w-md mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center items-center">
        {/* Checkmark Animation Centerpiece */}
        <div className="flex flex-col items-center mb-6 relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl relative"
            style={{ backgroundColor: WFTheme.colors.red }}
          >
            <CheckIcon size={40} color="#FFFFFF" />
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: WFTheme.colors.gold }}
            />
          </div>

          <h1 className="text-2xl font-extrabold text-[#1A1A1C] mt-5 tracking-tight text-center">
            Insight Captured
          </h1>
          <p className="text-xs text-[#4A4A50] mt-1 text-center max-w-xs">
            Feedback successfully recorded!
          </p>
        </div>

        {/* Details Card */}
        <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8EA] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#6B6B70] uppercase tracking-wider">Document ID</span>
            <span className="text-xs font-mono font-extrabold" style={{ color: WFTheme.colors.red }}>
              {documentId}
            </span>
          </div>

          <GoldDivider />

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#6B6B70] uppercase tracking-wider">Author / Anchor</span>
            <span className="text-xs font-bold text-[#1A1A1C]">{anchorName}</span>
          </div>

          <GoldDivider />

          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#6B6B70] uppercase tracking-wider">Collection Path</span>
            <span className="text-xs font-mono font-semibold text-[#1A1A1C] bg-[#FFF8E7] px-2 py-0.5 rounded border border-[#FFEBA8]">
              {collectionName}
            </span>
          </div>

          <GoldDivider />

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-bold text-[#6B6B70] uppercase tracking-wider">
                Live Record Path
              </span>
            </div>
            <div className="text-xs font-mono text-[#4A4A50] break-all bg-[#FAF9F7] p-2.5 rounded-lg border border-[#E8E8EA] flex items-center justify-between">
              <span>{collectionName}/{documentId}</span>
              <CheckIcon size={14} color="#10B981" />
            </div>
            <p className="text-[10px] text-[#9A9A9F]">Feedback record securely saved and synced.</p>
          </div>
        </div>

        <p className="text-xs font-medium text-[#9A9A9F] mt-6">
          Ready for the next conversation
        </p>
      </main>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-[#E8E8EA] py-3 px-5">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={onStartNew}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${WFTheme.colors.redBright} 0%, ${WFTheme.colors.redDeep} 100%)`,
              boxShadow: WFTheme.shadows.button,
            }}
          >
            <span>Start New Conversation</span>
            <ArrowRightIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
export default SuccessScreen;
