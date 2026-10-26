import React, { useState } from 'react';
import type { StructuredFeedback, Sentiment, InterestLevel } from '../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, CloudIcon } from '../components/icons';
import { InnovationBackground, GoldDivider } from '../components/InnovationBackground';
import { WFTheme } from '../theme';

interface ReviewScreenProps {
  feedback: StructuredFeedback;
  onUpdate: (feedback: StructuredFeedback) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const SENTIMENT_OPTIONS: Sentiment[] = ['positive', 'neutral', 'negative', 'mixed'];
const INTEREST_OPTIONS: InterestLevel[] = ['high', 'medium', 'low'];

export function ReviewScreen({ feedback, onUpdate, onSubmit, onBack }: ReviewScreenProps) {
  const update = (partial: Partial<StructuredFeedback>) => {
    onUpdate({ ...feedback, ...partial });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1C] relative flex flex-col justify-between">
      <InnovationBackground variant="light" />

      {/* Screen Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E8EA] px-5 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FAF9F7] hover:bg-[#F0F0F2] border border-[#E8E8EA] transition-all"
          >
            <ArrowLeftIcon size={18} />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-[#1A1A1C] leading-tight">Insight Captured</h1>
            <p className="text-[11px] text-[#6B6B70]">Review and refine what we heard from the conversation.</p>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto w-full px-5 py-6 flex-1 space-y-4">
        {/* Metadata Strip */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#6B6B70] bg-white p-2.5 rounded-xl border border-[#E8E8EA]">
          <span className="font-bold text-[#D52B1E]">{feedback.sessionId}</span>
          <span>•</span>
          <span className="text-[#1A1A1C] font-sans font-semibold">{feedback.anchorName}</span>
        </div>

        {/* Key Insight Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8EA]">
          <label className="block text-xs font-bold text-[#1A1A1C] uppercase tracking-wider mb-2">
            Key Insight / Summary
          </label>
          <textarea
            rows={3}
            value={feedback.summary}
            onChange={(e) => update({ summary: e.target.value })}
            className="w-full p-3 bg-[#FAF9F7] rounded-xl border border-[#E8E8EA] text-sm text-[#1A1A1C] focus:outline-none focus:border-[#D52B1E] transition-all resize-none"
          />
        </div>

        {/* Sentiment & Interest Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sentiment */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E8EA]">
            <label className="block text-xs font-bold text-[#1A1A1C] uppercase tracking-wider mb-2">
              Overall Sentiment
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SENTIMENT_OPTIONS.map((s) => {
                const isSelected = feedback.sentiment === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update({ sentiment: s })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      isSelected
                        ? s === 'negative'
                          ? 'bg-[#FEF2F2] text-[#D52B1E] border border-[#F8C5C5]'
                          : 'bg-[#D52B1E] text-white shadow-sm'
                        : 'bg-[#FAF9F7] text-[#6B6B70] border border-[#E8E8EA] hover:bg-[#F0F0F2]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interest Level */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E8EA]">
            <label className="block text-xs font-bold text-[#1A1A1C] uppercase tracking-wider mb-2">
              Interest Level
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_OPTIONS.map((l) => {
                const isSelected = feedback.interestLevel === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update({ interestLevel: l })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      isSelected
                        ? 'bg-[#D52B1E] text-white shadow-sm'
                        : 'bg-[#FAF9F7] text-[#6B6B70] border border-[#E8E8EA] hover:bg-[#F0F0F2]'
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Follow-up Required */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E8EA] flex items-center justify-between">
          <label className="text-xs font-bold text-[#1A1A1C] uppercase tracking-wider">
            Follow-up Required
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ followUpRequired: true })}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                feedback.followUpRequired
                  ? 'bg-[#D52B1E] text-white shadow-sm'
                  : 'bg-[#FAF9F7] text-[#6B6B70] border border-[#E8E8EA]'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => update({ followUpRequired: false })}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !feedback.followUpRequired
                  ? 'bg-[#1A1A1C] text-white shadow-sm'
                  : 'bg-[#FAF9F7] text-[#6B6B70] border border-[#E8E8EA]'
              }`}
            >
              No
            </button>
          </div>
        </div>

        <GoldDivider className="my-2" />

        {/* Editable Lists */}
        <EditableList
          title="What They Liked"
          items={feedback.liked}
          onChange={(liked) => update({ liked })}
          placeholder="Add something they liked..."
          accentColor={WFTheme.colors.success}
        />
        <EditableList
          title="Concerns"
          items={feedback.concerns}
          onChange={(concerns) => update({ concerns })}
          placeholder="Add a concern..."
          accentColor={WFTheme.colors.red}
        />
        <EditableList
          title="Pain Points"
          items={feedback.painPoints}
          onChange={(painPoints) => update({ painPoints })}
          placeholder="Add a pain point..."
          accentColor={WFTheme.colors.warning}
        />
        <EditableList
          title="Suggestions"
          items={feedback.suggestions}
          onChange={(suggestions) => update({ suggestions })}
          placeholder="Add a suggestion..."
          accentColor={WFTheme.colors.goldDeep}
        />

        {/* Source Evidence */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8EA]">
          <label className="block text-xs font-bold text-[#1A1A1C] uppercase tracking-wider mb-2">
            Source Evidence / Raw Transcript
          </label>
          <p className="text-xs text-[#4A4A50] leading-relaxed whitespace-pre-wrap bg-[#FAF9F7] p-3 rounded-xl border border-[#E8E8EA]">
            {feedback.transcript}
          </p>
        </div>
      </main>

      {/* Bottom Submit Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-[#E8E8EA] py-3 px-5">
        <div className="max-w-xl mx-auto">
          <button
            type="button"
            onClick={onSubmit}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${WFTheme.colors.redBright} 0%, ${WFTheme.colors.redDeep} 100%)`,
              boxShadow: WFTheme.shadows.button,
            }}
          >
            <CloudIcon size={20} color="#FFFFFF" />
            <span>Save Record to Firebase</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableList({
  title,
  items,
  onChange,
  placeholder,
  accentColor,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  accentColor: string;
}) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, val: string) => {
    const next = [...items];
    next[index] = val;
    onChange(next);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8EA]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-xs font-bold text-[#1A1A1C] uppercase tracking-wider">{title}</span>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-mono font-bold text-[#6B6B70] bg-[#FAF9F7] px-2 py-0.5 rounded-md border border-[#E8E8EA]">
            {items.length}
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              className="flex-1 px-3 py-1.5 bg-[#FAF9F7] rounded-lg border border-[#E8E8EA] text-xs text-[#1A1A1C] focus:outline-none focus:border-[#D52B1E]"
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="p-1.5 text-[#9A9A9F] hover:text-[#D52B1E] transition-colors"
            >
              <TrashIcon size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-[#FAF9F7] rounded-xl border border-[#E8E8EA] text-xs text-[#1A1A1C] placeholder-[#9A9A9F] focus:outline-none focus:border-[#D52B1E]"
        />
        <button
          type="button"
          onClick={addItem}
          className="p-2 rounded-xl bg-[#FAF9F7] hover:bg-[#F0F0F2] border border-[#E8E8EA] text-[#1A1A1C] transition-all"
        >
          <PlusIcon size={16} />
        </button>
      </div>
    </div>
  );
}
