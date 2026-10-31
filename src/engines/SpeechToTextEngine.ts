export type SpeechRecognitionCallback = (transcript: string, isFinal: boolean) => void;
export type SpeechRecognitionStatusCallback = (status: 'recording' | 'stopped' | 'error', error?: string) => void;

export class SpeechToTextEngine {
  private baseTranscript: string = '';
  private currentSessionText: string = '';
  private transcript: string = '';
  private isActive = false;
  private onTranscript: SpeechRecognitionCallback | null = null;
  private onStatus: SpeechRecognitionStatusCallback | null = null;
  private recognition: any = null;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  start(
    onTranscript: SpeechRecognitionCallback,
    onStatus: SpeechRecognitionStatusCallback,
    initialTranscript: string = ''
  ): void {
    // 1. Force cleanup of any previous recognition instance to unlock mobile mic
    this.cleanupRecognition();

    this.isActive = true;
    this.onTranscript = onTranscript;
    this.onStatus = onStatus;
    this.baseTranscript = initialTranscript.trim();
    this.currentSessionText = '';
    this.transcript = this.baseTranscript;

    this.initAndStartRecognition();
  }

  private initAndStartRecognition(): void {
    if (typeof window === 'undefined') return;
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.onStatus?.('error', 'Speech recognition is not supported on this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isActive = true;
        this.onStatus?.('recording');
      };

      this.recognition.onresult = (event: any) => {
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript + ' ';
        }
        this.currentSessionText = sessionTranscript.trim();

        // Combine with any previously existing transcript
        const combined = this.baseTranscript
          ? `${this.baseTranscript} ${this.currentSessionText}`.trim()
          : this.currentSessionText;

        this.transcript = combined;
        this.onTranscript?.(this.transcript, true);
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error;
        console.warn('SpeechRecognition event error:', error);

        // Ignore non-fatal pause/silence errors on mobile
        if (error === 'no-speech' || error === 'aborted') {
          return;
        }

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.isActive = false;
          this.cleanupRecognition();
          this.onStatus?.('error', 'Microphone permission denied. Please allow microphone access in your browser settings.');
          return;
        }

        // For other mobile errors, stop cleanly so the user can re-tap
        this.isActive = false;
        this.cleanupRecognition();
        this.onStatus?.('stopped');
      };

      this.recognition.onend = () => {
        // Commit this session's spoken text to the base transcript
        if (this.currentSessionText) {
          this.baseTranscript = this.transcript;
          this.currentSessionText = '';
        }

        // If the user hasn't explicitly tapped Stop and engine is still marked active,
        // attempt a clean restart (mobile browsers often terminate continuous recognition after silence)
        if (this.isActive) {
          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isActive) {
              try {
                this.cleanupRecognition();
                this.initAndStartRecognition();
              } catch (e) {
                console.warn('Failed to restart speech recognition on mobile:', e);
                this.isActive = false;
                this.cleanupRecognition();
                this.onStatus?.('stopped');
              }
            }
          }, 150);
        } else {
          this.cleanupRecognition();
          this.onStatus?.('stopped');
        }
      };

      this.recognition.start();
    } catch (e: any) {
      console.warn('Failed to start SpeechRecognition:', e);
      this.isActive = false;
      this.cleanupRecognition();
      this.onStatus?.('error', e?.message || 'Could not access microphone.');
    }
  }

  stop(): string {
    this.isActive = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.currentSessionText) {
      this.baseTranscript = this.transcript;
      this.currentSessionText = '';
    }

    this.cleanupRecognition();
    this.onStatus?.('stopped');
    return this.transcript;
  }

  private cleanupRecognition(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        // Detach listeners first so stale callbacks don't fire
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        // abort() forcefully releases the microphone hardware on mobile immediately
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  getCurrentTranscript(): string {
    return this.transcript;
  }

  setTranscript(text: string): void {
    this.transcript = text;
    this.baseTranscript = text;
    this.currentSessionText = '';
    this.onTranscript?.(text, true);
  }

  isRecording(): boolean {
    return this.isActive;
  }

  destroy(): void {
    this.stop();
    this.onTranscript = null;
    this.onStatus = null;
    this.baseTranscript = '';
    this.currentSessionText = '';
    this.transcript = '';
  }
}
