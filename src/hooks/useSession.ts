import { useCallback, useRef, useState } from 'react';
import type {
  StructuredFeedback,
  SessionPhase,
  RecordingStatus,
  ProcessingStage,
  FirebaseSubmitResult,
} from '../types';
import { SpeechToTextEngine } from '../engines/SpeechToTextEngine';
import { FeedbackSLMEngine } from '../engines/FeedbackSLMEngine';
import { GroqEngine, isGroqConfigured } from '../engines/GroqEngine';
import { FirebaseRepository } from '../engines/FirebaseRepository';
import { generateSessionId, nowISO } from '../utils/session';
import { APP_CONFIG } from '../config';

export function useSession() {
  const [phase, setPhase] = useState<SessionPhase>('welcome');
  const [anchorName, setAnchorName] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('tis_anchor_name') || '';
    }
    return '';
  });
  const [sessionId, setSessionId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedback, setFeedback] = useState<StructuredFeedback | null>(null);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
  const [submitResult, setSubmitResult] = useState<FirebaseSubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const speechEngineRef = useRef<SpeechToTextEngine | null>(null);
  const slmEngineRef = useRef<FeedbackSLMEngine | null>(null);
  const groqEngineRef = useRef<GroqEngine | null>(null);
  const firebaseRepoRef = useRef<FirebaseRepository | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initEngines = useCallback(() => {
    if (!speechEngineRef.current) {
      speechEngineRef.current = new SpeechToTextEngine();
    }
    if (!slmEngineRef.current) {
      slmEngineRef.current = new FeedbackSLMEngine();
    }
    if (!groqEngineRef.current) {
      groqEngineRef.current = new GroqEngine();
    }
    if (!firebaseRepoRef.current) {
      firebaseRepoRef.current = new FirebaseRepository();
    }
  }, []);

  const clearSession = useCallback(() => {
    setTranscript('');
    setFeedback(null);
    setSubmitResult(null);
    setErrorMessage('');
    setRecordingStatus('idle');
    setElapsedSeconds(0);
    setProcessingStages([]);
    setIsProcessing(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechEngineRef.current) {
      speechEngineRef.current.destroy();
      speechEngineRef.current = null;
    }
  }, []);

  const startSession = useCallback(
    (name: string) => {
      initEngines();
      const id = generateSessionId(APP_CONFIG.sessionIdPrefix);
      const cleanName = name.trim() || 'Booth Anchor';
      setAnchorName(cleanName);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tis_anchor_name', cleanName);
      }
      setSessionId(id);
      setPhase('conversation');
      setTranscript('');
      setRecordingStatus('idle');
      setElapsedSeconds(0);
    },
    [initEngines]
  );

  const submitDirectFeedback = useCallback(
    async (name: string, text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || trimmedText.length < 3) return;

      initEngines();
      const id = generateSessionId(APP_CONFIG.sessionIdPrefix);
      const anchor = name.trim() || 'Booth Anchor';
      setAnchorName(anchor);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tis_anchor_name', anchor);
      }
      setSessionId(id);
      setTranscript(trimmedText);
      setIsProcessing(true);
      setPhase('processing');
      setErrorMessage('');

      const stage2Label = 'Model is analyzing conversation...';
      const stage3Label = 'Structuring speaker dialogue & sentiments...';

      const stages: ProcessingStage[] = [
        { label: 'Feedback text captured', status: 'complete' },
        { label: 'Transcript prepared', status: 'complete' },
        { label: stage2Label, status: 'active' },
        { label: stage3Label, status: 'pending' },
        { label: 'Saving record...', status: 'pending' },
      ];
      setProcessingStages([...stages]);

      try {
        const groq = groqEngineRef.current ?? new GroqEngine();
        const slm = slmEngineRef.current ?? new FeedbackSLMEngine();
        const useGroq = isGroqConfigured();

        let result: StructuredFeedback | null = null;
        if (useGroq) {
          try {
            result = await groq.analyze(
              {
                transcript: trimmedText,
                sessionId: id,
                anchorName: anchor,
                timestamp: nowISO(),
              },
              (progress) => {
                if (progress.stage === 'analyzing') {
                  stages[2] = { label: stage2Label, status: 'active' };
                  setProcessingStages([...stages]);
                } else if (progress.stage === 'structuring') {
                  stages[2] = { label: stage2Label, status: 'complete' };
                  stages[3] = { label: stage3Label, status: 'active' };
                  setProcessingStages([...stages]);
                } else if (progress.stage === 'complete') {
                  stages[3] = { label: stage3Label, status: 'complete' };
                  setProcessingStages([...stages]);
                }
              }
            );
          } catch (groqErr) {
            console.warn('Primary model failed, activating on-device backup engine:', groqErr);
            result = null;
          }
        }

        // On primary failure or if not configured, use local engine backup so submission never fails
        if (!result) {
          stages[2] = { label: stage2Label, status: 'active' };
          setProcessingStages([...stages]);

          const slmResult = await slm.analyze(
            {
              transcript: trimmedText,
              sessionId: id,
              anchorName: anchor,
              timestamp: nowISO(),
            },
            (progress) => {
              if (progress.stage === 'analyzing') {
                stages[2] = { label: stage2Label, status: 'active' };
                setProcessingStages([...stages]);
              } else if (progress.stage === 'structuring') {
                stages[2] = { label: stage2Label, status: 'complete' };
                stages[3] = { label: stage3Label, status: 'active' };
                setProcessingStages([...stages]);
              } else if (progress.stage === 'complete') {
                stages[3] = { label: stage3Label, status: 'complete' };
                setProcessingStages([...stages]);
              }
            }
          );

          result = {
            ...slmResult,
            anchorSpeech: `Interview conducted by ${anchor}`,
            participantSpeech: trimmedText,
            participantSentiment: slmResult.sentiment,
            dialogue: [
              { speaker: 'anchor', text: `Questions asked by ${anchor}` },
              { speaker: 'participant', text: trimmedText },
            ],
          };
        }

        const validation = slm.validate(result);
        if (!validation.valid) {
          setErrorMessage(`AI output validation failed: ${validation.errors.join(' ')}`);
          setPhase('error');
          setIsProcessing(false);
          return;
        }

        setFeedback(result);
        setPhase('review');
        setIsProcessing(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed.';
        setErrorMessage(msg);
        setPhase('error');
        setIsProcessing(false);
      }
    },
    [initEngines]
  );

  const startRecording = useCallback(() => {
    initEngines();
    const engine = speechEngineRef.current!;

    engine.start(
      (text, _isFinal) => {
        setTranscript(text);
      },
      (status, error) => {
        if (status === 'recording') {
          setRecordingStatus('recording');
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setElapsedSeconds((s) => s + 1);
          }, 1000);
        } else if (status === 'stopped') {
          setRecordingStatus('stopped');
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        } else if (status === 'error') {
          if (error?.includes('permission')) {
            setRecordingStatus('permission-denied');
          } else {
            setRecordingStatus('error');
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      transcript
    );
  }, [initEngines, transcript]);

  const stopRecording = useCallback(() => {
    if (speechEngineRef.current) {
      const finalTranscript = speechEngineRef.current.stop();
      setTranscript(finalTranscript);
    }
    setRecordingStatus('stopped');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateTranscript = useCallback((text: string) => {
    setTranscript(text);
    if (speechEngineRef.current) {
      speechEngineRef.current.setTranscript(text);
    }
  }, []);

  const submitFeedback = useCallback(async () => {
    if (!transcript.trim() || transcript.trim().length < 3) {
      setErrorMessage('Transcript is too short. Please record a conversation before submitting.');
      return;
    }

    setIsProcessing(true);
    setPhase('processing');
    setErrorMessage('');

    const stage2Label = 'Model is analyzing conversation...';
    const stage3Label = 'Structuring speaker dialogue & sentiments...';

    const stages: ProcessingStage[] = [
      { label: 'Speech captured', status: 'complete' },
      { label: 'Transcript prepared', status: 'complete' },
      { label: stage2Label, status: 'active' },
      { label: stage3Label, status: 'pending' },
      { label: 'Saving record...', status: 'pending' },
    ];
    setProcessingStages([...stages]);

    try {
      const groq = groqEngineRef.current ?? new GroqEngine();
      const slm = slmEngineRef.current ?? new FeedbackSLMEngine();
      const useGroq = isGroqConfigured();

      let result: StructuredFeedback | null = null;
      if (useGroq) {
        try {
          result = await groq.analyze(
            {
              transcript: transcript.trim(),
              sessionId,
              anchorName,
              timestamp: nowISO(),
            },
            (progress) => {
              if (progress.stage === 'analyzing') {
                stages[2] = { label: stage2Label, status: 'active' };
                setProcessingStages([...stages]);
              } else if (progress.stage === 'structuring') {
                stages[2] = { label: stage2Label, status: 'complete' };
                stages[3] = { label: stage3Label, status: 'active' };
                setProcessingStages([...stages]);
              } else if (progress.stage === 'complete') {
                stages[3] = { label: stage3Label, status: 'complete' };
                setProcessingStages([...stages]);
              }
            }
          );
        } catch (groqErr) {
          console.warn('Primary model failed, activating on-device backup engine:', groqErr);
          result = null;
        }
      }

      // On primary failure or if not configured, use local engine backup so submission never fails
      if (!result) {
        stages[2] = { label: stage2Label, status: 'active' };
        setProcessingStages([...stages]);

        const slmResult = await slm.analyze(
          {
            transcript: transcript.trim(),
            sessionId,
            anchorName,
            timestamp: nowISO(),
          },
          (progress) => {
            if (progress.stage === 'analyzing') {
              stages[2] = { label: stage2Label, status: 'active' };
              setProcessingStages([...stages]);
            } else if (progress.stage === 'structuring') {
              stages[2] = { label: stage2Label, status: 'complete' };
              stages[3] = { label: stage3Label, status: 'active' };
              setProcessingStages([...stages]);
            } else if (progress.stage === 'complete') {
              stages[3] = { label: stage3Label, status: 'complete' };
              setProcessingStages([...stages]);
            }
          }
        );

        result = {
          ...slmResult,
          anchorSpeech: `Interview conducted by ${anchorName}`,
          participantSpeech: transcript.trim(),
          participantSentiment: slmResult.sentiment,
          dialogue: [
            { speaker: 'anchor', text: `Questions asked by ${anchorName}` },
            { speaker: 'participant', text: transcript.trim() },
          ],
        };
      }

      const validation = slm.validate(result);
      if (!validation.valid) {
        setErrorMessage(`AI output validation failed: ${validation.errors.join(' ')}`);
        setPhase('error');
        setIsProcessing(false);
        return;
      }

      setFeedback(result);
      setPhase('review');
      setIsProcessing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setErrorMessage(msg);
      setPhase('error');
      setIsProcessing(false);
    }
  }, [transcript, sessionId, anchorName]);

  const submitToFirebase = useCallback(async () => {
    if (!feedback) return;
    setIsProcessing(true);
    setErrorMessage('');

    const stages: ProcessingStage[] = [
      { label: 'Speech captured', status: 'complete' },
      { label: 'Transcript prepared', status: 'complete' },
      { label: 'Analyzing feedback', status: 'complete' },
      { label: 'Creating structured insight', status: 'complete' },
      { label: 'Saving record...', status: 'active' },
    ];
    setProcessingStages([...stages]);
    setPhase('processing');

    try {
      const repo = firebaseRepoRef.current ?? new FirebaseRepository();
      const result = await repo.submitFeedback(feedback);

      if (result.success) {
        setSubmitResult(result);
        stages[4] = { label: 'Saving record...', status: 'complete' };
        setProcessingStages([...stages]);
        setPhase('success');
        setIsProcessing(false);
      } else {
        setErrorMessage(result.error || 'Submission failed.');
        setPhase('error');
        setIsProcessing(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      setErrorMessage(msg);
      setPhase('error');
      setIsProcessing(false);
    }
  }, [feedback]);

  const updateFeedback = useCallback((updated: StructuredFeedback) => {
    setFeedback(updated);
  }, []);

  const retrySubmit = useCallback(() => {
    setErrorMessage('');
    submitToFirebase();
  }, [submitToFirebase]);

  const startNewConversation = useCallback(() => {
    clearSession();
    const newId = generateSessionId(APP_CONFIG.sessionIdPrefix);
    setSessionId(newId);
    setPhase('conversation');
    setTranscript('');
    setRecordingStatus('idle');
    setElapsedSeconds(0);
    setFeedback(null);
    setSubmitResult(null);
    setErrorMessage('');
    initEngines();
  }, [clearSession, initEngines]);

  const cancelSession = useCallback(() => {
    clearSession();
    setPhase('welcome');
    const rememberedName = (typeof window !== 'undefined' && window.localStorage.getItem('tis_anchor_name')) || '';
    setAnchorName(rememberedName);
    setSessionId('');
  }, [clearSession]);

  const backToConversation = useCallback(() => {
    setPhase('conversation');
    setFeedback(null);
    setErrorMessage('');
  }, []);

  return {
    phase,
    anchorName,
    sessionId,
    transcript,
    recordingStatus,
    elapsedSeconds,
    feedback,
    processingStages,
    submitResult,
    errorMessage,
    isProcessing,
    startSession,
    submitDirectFeedback,
    startRecording,
    stopRecording,
    updateTranscript,
    submitFeedback,
    submitToFirebase,
    updateFeedback,
    retrySubmit,
    startNewConversation,
    cancelSession,
    backToConversation,
  };
}
