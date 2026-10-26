import type { StructuredFeedback, Sentiment, InterestLevel } from '../types';

export interface SLMAnalyzeParams {
  transcript: string;
  sessionId: string;
  anchorName: string;
  timestamp: string;
}

export interface SLMAnalyzeProgress {
  stage: 'analyzing' | 'structuring' | 'complete' | 'error';
  message: string;
}

export type SLMProgressCallback = (progress: SLMAnalyzeProgress) => void;

const SENTIMENT_KEYWORDS = {
  positive: ['great', 'love', 'excellent', 'amazing', 'fantastic', 'impressed', 'exciting', 'innovative', 'helpful', 'useful', 'good', 'wonderful', 'outstanding', 'remarkable', 'brilliant'],
  negative: ['concern', 'worried', 'problem', 'issue', 'frustrated', 'difficult', 'bad', 'poor', 'disappointing', 'confusing', 'slow', 'broken', 'fail', 'hate', 'terrible', 'awful'],
} as const;

const INTEREST_KEYWORDS = {
  high: ['very interested', 'excited', 'definitely', 'want to learn more', 'can\'t wait', 'love to', 'eager', 'keen', 'enthusiastic', 'fascinating', 'compelling'],
  low: ['not interested', 'maybe', 'perhaps', 'not sure', 'unlikely', 'pass', 'indifferent', 'neutral'],
} as const;

const LIKED_PATTERNS = [
  /\bi\s+(?:really\s+)?(?:liked|loved|enjoyed|appreciated)\s+(?:the\s+)?(.+?)(?:\.|,|;|$)/gi,
  /\bi\s+(?:was\s+)?(?:impressed|fascinated|intrigued)\s+(?:by\s+|with\s+)?(.+?)(?:\.|,|;|$)/gi,
  /\bwhat\s+i\s+(?:really\s+)?liked\s+(?:about\s+)?(?:it\s+)?(?:was|is)\s+(.+?)(?:\.|,|;|$)/gi,
  /\b(?:great|excellent|amazing)\s+(?:feature|demo|presentation|tool|solution|approach)\s+(.+?)(?:\.|,|;|$)/gi,
];

const CONCERN_PATTERNS = [
  /\bi(?:'m| am)\s+(?:concerned|worried)\s+(?:about\s+)?(.+?)(?:\.|,|;|$)/gi,
  /\bmy\s+(?:concern|worry)\s+(?:is|was)\s+(.+?)(?:\.|,|;|$)/gi,
  /\b(?:one\s+)?(?:issue|problem)\s+(?:is|was)\s+(.+?)(?:\.|,|;|$)/gi,
  /\bi\s+(?:don't|do not)\s+(?:like|understand)\s+(?:the\s+)?(.+?)(?:\.|,|;|$)/gi,
];

const PAIN_POINT_PATTERNS = [
  /\b(?:pain\s*point|struggle|frustration|bottleneck|roadblock|barrier)\s*(?:is|was)?\s*:?\s*(.+?)(?:\.|,|;|$)/gi,
  /\bi\s+(?:struggle|struggled)\s+(?:with\s+)?(.+?)(?:\.|,|;|$)/gi,
  /\bit(?:'s| is)\s+(?:hard|difficult|challenging)\s+to\s+(.+?)(?:\.|,|;|$)/gi,
  /\b(?:currently|today)\s+(?:we\s+)?(?:have\s+)?(?:a\s+)?(?:problem|issue)\s+(?:with\s+)?(.+?)(?:\.|,|;|$)/gi,
];

const SUGGESTION_PATTERNS = [
  /\bi\s+(?:suggest|recommend|propose)\s+(.+?)(?:\.|,|;|$)/gi,
  /\b(?:suggestion|recommendation|idea)\s*(?:is|was)?\s*:?\s*(.+?)(?:\.|,|;|$)/gi,
  /\b(?:would|could|should)\s+(?:be\s+)?(?:nice|great|helpful)\s+to\s+(?:have|see|add)\s+(.+?)(?:\.|,|;|$)/gi,
  /\b(?:if only|wish)\s+(?:it|they|we)\s+(?:could|would|can)\s+(.+?)(?:\.|,|;|$)/gi,
];

const FOLLOWUP_PATTERNS = [
  /\b(?:follow[\s-]?up|reach\s+out|contact\s+me|get\s+in\s+touch|send\s+me|let\s+me\s+know)\b/gi,
  /\bi(?:'d| would)\s+like\s+(?:to\s+)?(?:learn|hear|see)\s+more\b/gi,
  /\b(?:interested\s+in\s+a\s+)?demo\b/gi,
  /\b(?:schedule|set\s+up)\s+(?:a\s+)?(?:meeting|call|demo)\b/gi,
];

function extractMatches(text: string, patterns: RegExp[]): string[] {
  const results: string[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(text)) !== null) {
      const extracted = match[1]?.trim();
      if (extracted && extracted.length > 2 && !results.includes(extracted)) {
        results.push(capitalize(extracted));
      }
    }
  }
  return results;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const kw of SENTIMENT_KEYWORDS.positive) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) pos += matches.length;
  }
  for (const kw of SENTIMENT_KEYWORDS.negative) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) neg += matches.length;
  }
  if (pos === 0 && neg === 0) return 'neutral';
  if (pos > 0 && neg === 0) return 'positive';
  if (neg > 0 && pos === 0) return 'negative';
  if (Math.abs(pos - neg) <= 1) return 'mixed';
  return pos > neg ? 'positive' : 'negative';
}

function detectInterestLevel(text: string): InterestLevel {
  const lower = text.toLowerCase();
  for (const kw of INTEREST_KEYWORDS.high) {
    if (lower.includes(kw)) return 'high';
  }
  for (const kw of INTEREST_KEYWORDS.low) {
    if (lower.includes(kw)) return 'low';
  }
  const positiveCount = (lower.match(/\b(good|great|nice|interesting|cool)\b/g) || []).length;
  if (positiveCount >= 2) return 'medium';
  return 'medium';
}

function generateSummary(text: string): string {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  if (sentences.length === 0) return 'No summary could be generated from the transcript.';
  if (sentences.length <= 2) return sentences.join('. ') + '.';
  const first = sentences[0];
  const last = sentences[sentences.length - 1];
  let summary = first;
  if (sentences.length > 3) {
    const middle = sentences[Math.floor(sentences.length / 2)];
    summary = `${first}. ${middle}`;
  }
  if (last !== first && last !== sentences[Math.floor(sentences.length / 2)]) {
    summary += `. ${last}`;
  }
  return summary + '.';
}

function detectFollowUp(text: string): boolean {
  for (const pattern of FOLLOWUP_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    if (re.test(text)) return true;
  }
  return false;
}

function validateSentiment(value: string): Sentiment {
  const valid: Sentiment[] = ['positive', 'neutral', 'negative', 'mixed'];
  return valid.includes(value as Sentiment) ? (value as Sentiment) : 'neutral';
}

function validateInterestLevel(value: string): InterestLevel {
  const valid: InterestLevel[] = ['high', 'medium', 'low'];
  return valid.includes(value as InterestLevel) ? (value as InterestLevel) : 'medium';
}

export class FeedbackSLMEngine {
  async analyze(
    params: SLMAnalyzeParams,
    onProgress?: SLMProgressCallback
  ): Promise<StructuredFeedback> {
    const { transcript, sessionId, anchorName, timestamp } = params;

    if (!transcript || transcript.trim().length < 3) {
      onProgress?.({ stage: 'error', message: 'Transcript is too short to analyze.' });
      throw new Error('Transcript is too short to analyze.');
    }

    onProgress?.({ stage: 'analyzing', message: 'Analyzing conversation transcript...' });
    await delay(600);

    onProgress?.({ stage: 'structuring', message: 'Creating structured insight...' });
    await delay(500);

    const sentiment = detectSentiment(transcript);
    const interestLevel = detectInterestLevel(transcript);
    const liked = extractMatches(transcript, LIKED_PATTERNS);
    const concerns = extractMatches(transcript, CONCERN_PATTERNS);
    const painPoints = extractMatches(transcript, PAIN_POINT_PATTERNS);
    const suggestions = extractMatches(transcript, SUGGESTION_PATTERNS);
    const followUpRequired = detectFollowUp(transcript);
    const summary = generateSummary(transcript);

    const feedback: StructuredFeedback = {
      sessionId,
      anchorName,
      timestamp,
      summary,
      sentiment: validateSentiment(sentiment),
      interestLevel: validateInterestLevel(interestLevel),
      liked,
      concerns,
      painPoints,
      suggestions,
      followUpRequired,
      transcript,
    };

    onProgress?.({ stage: 'complete', message: 'Analysis complete.' });
    return feedback;
  }

  validate(feedback: StructuredFeedback): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!feedback.sessionId) errors.push('Missing session ID.');
    if (!feedback.anchorName) errors.push('Missing anchor name.');
    if (!feedback.timestamp) errors.push('Missing timestamp.');
    if (!feedback.transcript) errors.push('Missing transcript.');
    if (!feedback.summary) errors.push('Missing summary.');
    const validSentiments: Sentiment[] = ['positive', 'neutral', 'negative', 'mixed'];
    if (!validSentiments.includes(feedback.sentiment)) errors.push('Invalid sentiment value.');
    const validInterests: InterestLevel[] = ['high', 'medium', 'low'];
    if (!validInterests.includes(feedback.interestLevel)) errors.push('Invalid interest level.');
    if (!Array.isArray(feedback.liked)) errors.push('Liked must be an array.');
    if (!Array.isArray(feedback.concerns)) errors.push('Concerns must be an array.');
    if (!Array.isArray(feedback.painPoints)) errors.push('Pain points must be an array.');
    if (!Array.isArray(feedback.suggestions)) errors.push('Suggestions must be an array.');
    if (typeof feedback.followUpRequired !== 'boolean') errors.push('Follow-up required must be boolean.');
    return { valid: errors.length === 0, errors };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
