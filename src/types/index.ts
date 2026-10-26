export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';
export type InterestLevel = 'high' | 'medium' | 'low';

export interface StructuredFeedback {
  sessionId: string;
  anchorName: string;
  timestamp: string;
  summary: string;
  sentiment: Sentiment;
  interestLevel: InterestLevel;
  liked: string[];
  concerns: string[];
  painPoints: string[];
  suggestions: string[];
  followUpRequired: boolean;
  transcript: string;
}

export type SessionPhase =
  | 'welcome'
  | 'conversation'
  | 'processing'
  | 'review'
  | 'success'
  | 'error';

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'permission-denied' | 'unsupported' | 'error';

export interface ProcessingStage {
  label: string;
  status: 'pending' | 'active' | 'complete';
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface SessionMetadata {
  sessionId: string;
  anchorName: string;
  summitTitle: string;
  startedAt: string;
}

export interface FirebaseSubmitResult {
  success: boolean;
  documentId?: string;
  collectionName?: string;
  error?: string;
}

export interface GitHubSubmitResult {
  success: boolean;
  commitSha?: string;
  filePath?: string;
  error?: string;
}

export type SubmitResult = FirebaseSubmitResult;


