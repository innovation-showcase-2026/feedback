import { Groq } from 'groq-sdk';
import type { StructuredFeedback, Sentiment, InterestLevel, DialogueTurn } from '../types';

export interface GroqAnalyzeParams {
  transcript: string;
  sessionId: string;
  anchorName: string;
  timestamp: string;
}

export interface GroqAnalyzeProgress {
  stage: 'analyzing' | 'structuring' | 'complete' | 'error';
  message: string;
}

export type GroqProgressCallback = (progress: GroqAnalyzeProgress) => void;

export function getGroqApiKey(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('groq_api_key');
    if (saved && saved.trim().length > 0) return saved.trim();
  }
  try {
    const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY;
    if (envKey && String(envKey).trim().length > 0) {
      return String(envKey).trim();
    }
  } catch {
    // ignore
  }
  return '';
}

export function setGroqApiKey(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('groq_api_key', key.trim());
  }
}

export function isGroqConfigured(): boolean {
  return getGroqApiKey().length > 0;
}

export class GroqEngine {
  private defaultModel = 'openai/gpt-oss-120b';

  async analyze(
    params: GroqAnalyzeParams,
    onProgress?: GroqProgressCallback,
    customApiKey?: string
  ): Promise<StructuredFeedback> {
    const { transcript, sessionId, anchorName, timestamp } = params;

    if (!transcript || transcript.trim().length < 3) {
      onProgress?.({ stage: 'error', message: 'Transcript is too short to analyze.' });
      throw new Error('Transcript is too short to analyze.');
    }

    const apiKey = (customApiKey || getGroqApiKey()).trim();
    if (!apiKey) {
      throw new Error(
        'Groq API Key is missing. Please provide your Groq API key in .env (VITE_GROQ_API_KEY) or enter it in settings.'
      );
    }

    onProgress?.({
      stage: 'analyzing',
      message: 'Connecting to Groq AI to divide speech & analyze sentiment...',
    });

    const groq = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const systemPrompt = `You are an expert conversation analyst for the Technology Innovation Summit 2026.
You are given a raw transcribed conversation between an Anchor/Interviewer (named "${anchorName}") and a Participant/Visitor.

Your tasks:
1. Divide the speech between what the Anchor said and what the Participant said.
2. Determine the sentiment of the PARTICIPANT's speech specifically (must be one of: "positive", "neutral", "negative", "mixed").
3. Determine the overall sentiment (must be one of: "positive", "neutral", "negative", "mixed").
4. Determine the participant's interest level (must be one of: "high", "medium", "low").
5. Extract key details:
   - summary: 1-2 sentence executive summary of the participant's key takeaway.
   - liked: Array of specific things the participant liked or appreciated.
   - concerns: Array of concerns expressed by the participant.
   - painPoints: Array of frustrations, bottlenecks, or pain points mentioned.
   - suggestions: Array of constructive ideas/suggestions.
   - followUpRequired: Boolean (true if participant requested demo, contact, or follow-up).
6. Provide chronological dialogue turns: array of { "speaker": "anchor" | "participant", "text": "..." }.

Return strictly valid JSON only (do not include markdown ticks, do not include preamble).
JSON Schema:
{
  "anchorSpeech": "string",
  "participantSpeech": "string",
  "participantSentiment": "positive" | "neutral" | "negative" | "mixed",
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "interestLevel": "high" | "medium" | "low",
  "summary": "string",
  "liked": ["string"],
  "concerns": ["string"],
  "painPoints": ["string"],
  "suggestions": ["string"],
  "followUpRequired": boolean,
  "dialogue": [
    { "speaker": "anchor" | "participant", "text": "string" }
  ]
}`;

    let rawOutput = '';

    // First try with the requested model and parameters
    try {
      rawOutput = await this.executeCompletion(groq, this.defaultModel, systemPrompt, transcript, true);
    } catch (err: any) {
      console.warn('Initial Groq request failed, trying fallback options:', err);
      const errMsg = err?.message || String(err);
      
      // If reasoning_effort is unsupported or invalid, try without reasoning_effort
      if (errMsg.includes('reasoning_effort') || errMsg.includes('extra fields not permitted')) {
        try {
          rawOutput = await this.executeCompletion(groq, this.defaultModel, systemPrompt, transcript, false);
        } catch (retryErr: any) {
          // If model doesn't exist, try llama-3.3-70b-versatile
          rawOutput = await this.executeCompletion(groq, 'llama-3.3-70b-versatile', systemPrompt, transcript, false);
        }
      } else if (errMsg.includes('model') || errMsg.includes('not found') || errMsg.includes('decommissioned')) {
        // Fallback to standard Groq model
        rawOutput = await this.executeCompletion(groq, 'llama-3.3-70b-versatile', systemPrompt, transcript, false);
      } else {
        throw err;
      }
    }

    onProgress?.({
      stage: 'structuring',
      message: 'Structuring Groq JSON analysis and speaker separation...',
    });

    const parsed = this.parseJsonOutput(rawOutput);

    const feedback: StructuredFeedback = {
      sessionId,
      anchorName,
      timestamp,
      summary: parsed.summary || 'Summary captured via Groq AI.',
      sentiment: this.normalizeSentiment(parsed.sentiment),
      interestLevel: this.normalizeInterest(parsed.interestLevel),
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      followUpRequired: Boolean(parsed.followUpRequired),
      transcript,
      anchorSpeech: parsed.anchorSpeech || '',
      participantSpeech: parsed.participantSpeech || '',
      participantSentiment: this.normalizeSentiment(parsed.participantSentiment || parsed.sentiment),
      dialogue: Array.isArray(parsed.dialogue) ? parsed.dialogue : [],
    };

    onProgress?.({ stage: 'complete', message: 'Groq AI analysis complete.' });
    return feedback;
  }

  private async executeCompletion(
    groq: Groq,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    useReasoningEffort: boolean
  ): Promise<string> {
    const options: any = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model,
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: true,
      stop: null,
    };

    if (useReasoningEffort) {
      options.reasoning_effort = 'medium';
    }

    const chatCompletion = (await groq.chat.completions.create(options)) as unknown as AsyncIterable<any>;

    let fullContent = '';
    for await (const chunk of chatCompletion) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullContent += delta;
    }

    return fullContent;
  }

  private parseJsonOutput(text: string): any {
    // Strip markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try finding JSON object bounds if there's surrounding text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Groq JSON output. Raw output was:', text);
      throw new Error(`Groq returned invalid JSON: ${cleaned.slice(0, 150)}...`);
    }
  }

  private normalizeSentiment(val: any): Sentiment {
    const valid: Sentiment[] = ['positive', 'neutral', 'negative', 'mixed'];
    if (typeof val === 'string' && valid.includes(val.toLowerCase() as Sentiment)) {
      return val.toLowerCase() as Sentiment;
    }
    return 'neutral';
  }

  private normalizeInterest(val: any): InterestLevel {
    const valid: InterestLevel[] = ['high', 'medium', 'low'];
    if (typeof val === 'string' && valid.includes(val.toLowerCase() as InterestLevel)) {
      return val.toLowerCase() as InterestLevel;
    }
    return 'medium';
  }
}
