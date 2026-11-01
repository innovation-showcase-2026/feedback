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
    // 1. If an existing recognition is running or lingering, stop it cleanly first
    if (this.recognition || this.isActive) {
      this.cleanupRecognition(true);
    }

    this.isActive = true;
    this.onTranscript = onTranscript;
    this.onStatus = onStatus;
    this.baseTranscript = initialTranscript.trim();
    this.currentSessionText = '';
    this.transcript = this.baseTranscript;

    // A brief delay ensures the OS microphone stream from any previous instance is fully released
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (this.isActive) {
        this.initAndStartRecognition();
      }
    }, 120);
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
      // Clean up previous instance listeners before instantiating new one
      if (this.recognition) {
        try {
          this.recognition.onstart = null;
          this.recognition.onresult = null;
          this.recognition.onerror = null;
          this.recognition.onend = null;
          this.recognition.stop();
        } catch {
          // ignore
        }
        this.recognition = null;
      }

      this.recognition = new SpeechRecognitionClass();
      // Anchor to window to prevent V8 Garbage Collection from sweeping active recognition (Chromium issue 416660)
      win.__tisSpeechRecognition = this.recognition;

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
          this.cleanupRecognition(true);
          this.onStatus?.('error', 'Microphone permission denied. Please allow microphone access in your browser settings.');
          return;
        }

        // For other mobile errors, stop cleanly so the user can re-tap
        this.isActive = false;
        this.cleanupRecognition(false);
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
                this.initAndStartRecognition();
              } catch (e) {
                console.warn('Failed to restart speech recognition on mobile:', e);
                this.isActive = false;
                this.cleanupRecognition(false);
                this.onStatus?.('stopped');
              }
            }
          }, 200);
        } else {
          this.cleanupRecognition(false);
          this.onStatus?.('stopped');
        }
      };

      this.recognition.start();
    } catch (e: any) {
      console.warn('Failed to start SpeechRecognition:', e);
      this.isActive = false;
      this.cleanupRecognition(false);
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

    if (this.recognition) {
      try {
        // Gracefully stop recognition so the browser releases the mic cleanly
        this.recognition.stop();
      } catch {
        try {
          this.recognition.abort();
        } catch {
          // ignore
        }
      }
    }

    this.cleanupRecognition(false);
    this.onStatus?.('stopped');
    return this.transcript;
  }

  private cleanupRecognition(forceAbort: boolean = false): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      const rec = this.recognition;
      try {
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        if (forceAbort) {
          rec.abort();
        } else {
          rec.stop();
        }
      } catch {
        try {
          rec.abort();
        } catch {
          // ignore
        }
      }
      this.recognition = null;
      if (typeof window !== 'undefined') {
        (window as any).__tisSpeechRecognition = null;
      }
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

  reset(): void {
    this.isActive = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.cleanupRecognition(false);
    this.baseTranscript = '';
    this.currentSessionText = '';
    this.transcript = '';
    this.onTranscript = null;
    this.onStatus = null;
  }

  destroy(): void {
    this.reset();
  }
}
