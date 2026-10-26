import React from 'react';
import type { RecordingStatus } from '../types';
import { TrashIcon, ArrowRightIcon, MicIcon, StopIcon } from '../components/icons';
import { InnovationBackground, Waveform } from '../components/InnovationBackground';
import { WFTheme } from '../theme';
import { formatElapsedTime } from '../utils/session';

interface ConversationScreenProps {
  transcript: string;
  recordingStatus: RecordingStatus;
  elapsedSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void | Promise<void>;
  onUpdateTranscript: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ConversationScreen({
  transcript,
  recordingStatus,
  elapsedSeconds,
  onStartRecording,
  onStopRecording,
  onUpdateTranscript,
  onSubmit,
  onCancel,
}: ConversationScreenProps) {
  const isRecording = recordingStatus === 'recording';
  const hasFeedback = transcript.trim().length >= 3;

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1C] relative flex flex-col justify-between">
      <InnovationBackground variant="light" />

      <main className="max-w-xl mx-auto w-full px-5 py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-[#1A1A1C] tracking-tight">
            Collect Feedback
          </h1>
          <p className="text-xs text-[#4A4A50] mt-1">
            Dictate via your microphone or type visitor feedback notes below to submit.
          </p>
        </div>

        {/* Live Mic Control Strip */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E8EA] mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                isRecording ? 'bg-[#D52B1E] animate-pulse text-white' : 'bg-[#FEF2F2] text-[#D52B1E] hover:bg-[#FDE8E8]'
              }`}
            >
              {isRecording ? <StopIcon size={20} color="#FFFFFF" /> : <MicIcon size={22} color="#D52B1E" />}
            </button>
            <div>
              <div className="text-xs font-bold text-[#1A1A1C]">
                {isRecording ? 'Listening (Live Transcription)...' : 'Microphone Inactive'}
              </div>
              <div className="text-[11px] text-[#6B6B70]">
                {isRecording ? `Recording: ${formatElapsedTime(elapsedSeconds)}` : 'Click mic button to start voice dictation'}
              </div>
            </div>
          </div>

          <Waveform isActive={isRecording} bars={16} />
        </div>

        {/* Feedback Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8EA] flex-1 flex flex-col mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D52B1E]" />
              <span className="text-xs font-bold text-[#1A1A1C]">Visitor Feedback & Notes</span>
            </div>
            {hasFeedback && (
              <button
                type="button"
                onClick={() => onUpdateTranscript('')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#6B6B70] hover:text-[#D52B1E] transition-colors"
              >
                <TrashIcon size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => onUpdateTranscript(e.target.value)}
            placeholder="Speak into microphone or type feedback notes here..."
            className="w-full flex-1 min-h-[220px] p-3.5 bg-[#FAF9F7] rounded-xl border border-[#E8E8EA] text-sm text-[#1A1A1C] placeholder-[#9A9A9F] focus:outline-none focus:border-[#D52B1E] focus:ring-1 focus:ring-[#D52B1E] resize-none transition-all leading-relaxed"
          />

          <div className="flex items-center justify-between mt-3 text-[11px] text-[#6B6B70]">
            <span>Supported in modern desktop & mobile browsers.</span>
            <span className="font-mono font-semibold">{transcript.trim().length} chars</span>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-[#E8E8EA] py-3 px-5">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-5 rounded-xl text-xs font-bold text-[#4A4A50] bg-[#FAF9F7] hover:bg-[#F0F0F2] border border-[#E8E8EA] transition-all"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!hasFeedback}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              hasFeedback
                ? 'active:scale-[0.99] cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{
              background: hasFeedback
                ? `linear-gradient(135deg, ${WFTheme.colors.redBright} 0%, ${WFTheme.colors.redDeep} 100%)`
                : '#CCCCCC',
              boxShadow: hasFeedback ? WFTheme.shadows.button : 'none',
            }}
          >
            <span>Submit Feedback</span>
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
