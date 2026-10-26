import React from 'react';
import { AlertIcon, RefreshIcon, ArrowLeftIcon } from '../components/icons';
import { InnovationBackground, GoldDivider } from '../components/InnovationBackground';
import { WFTheme } from '../theme';

interface ErrorScreenProps {
  errorMessage: string;
  onRetry: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function ErrorScreen({ errorMessage, onRetry, onBack, onCancel }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1C] relative flex flex-col justify-center items-center px-6 py-12">
      <InnovationBackground variant="light" />

      <main className="max-w-md w-full flex flex-col items-center">
        {/* Error Icon Centerpiece */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FEF2F2] border border-[#F8C5C5] flex items-center justify-center mb-4">
            <AlertIcon size={32} color={WFTheme.colors.red} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1C] text-center">Submission Failed</h1>
          <p className="text-xs text-[#4A4A50] text-center mt-1 max-w-xs">
            Your conversation notes are still saved. You can retry or edit your feedback.
          </p>
        </div>

        {/* Error Details Card */}
        <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8EA] mb-6">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#D52B1E]" />
            <span className="text-[10px] font-bold text-[#D52B1E] uppercase tracking-wider">
              Error Details
            </span>
          </div>
          <GoldDivider className="my-2" />
          <p className="text-xs text-[#4A4A50] leading-relaxed break-words">
            {errorMessage || 'An unexpected error occurred during submission.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${WFTheme.colors.redBright} 0%, ${WFTheme.colors.redDeep} 100%)`,
              boxShadow: WFTheme.shadows.button,
            }}
          >
            <RefreshIcon size={18} color="#FFFFFF" />
            <span>Retry Submission</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-[#1A1A1C] bg-white hover:bg-[#FAF9F7] border border-[#E8E8EA] flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeftIcon size={16} />
              <span>Edit Feedback</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-5 rounded-xl text-xs font-semibold text-[#6B6B70] hover:text-[#1A1A1C] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
