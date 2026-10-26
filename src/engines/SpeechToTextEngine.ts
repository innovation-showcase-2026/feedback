export type SpeechRecognitionCallback = (transcript: string, isFinal: boolean) => void;
export type SpeechRecognitionStatusCallback = (status: 'recording' | 'stopped' | 'error', error?: string) => void;

export class SpeechToTextEngine {
  private transcript: string = '';
  private isActive = false;
  private onTranscript: SpeechRecognitionCallback | null = null;
  private onStatus: SpeechRecognitionStatusCallback | null = null;
  private recognition: any = null;

  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  start(
    onTranscript: SpeechRecognitionCallback,
    onStatus: SpeechRecognitionStatusCallback
  ): void {
    this.isActive = true;
    this.onTranscript = onTranscript;
    this.onStatus = onStatus;

    if (typeof window !== 'undefined') {
      const win = window as any;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
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
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              fullTranscript += event.results[i][0].transcript + ' ';
            }
            this.transcript = fullTranscript.trim();
            this.onTranscript?.(this.transcript, true);
          };

          this.recognition.onerror = (event: any) => {
            console.warn('SpeechRecognition error:', event.error);
            if (event.error === 'not-allowed') {
              this.onStatus?.('error', 'Microphone permission denied.');
            }
          };

          this.recognition.onend = () => {
            if (this.isActive) {
              try {
                this.recognition.start();
              } catch {
                this.isActive = false;
                this.onStatus?.('stopped');
              }
            } else {
              this.onStatus?.('stopped');
            }
          };

          this.recognition.start();
          return;
        } catch (e) {
          console.warn('Failed to start SpeechRecognition:', e);
        }
      }
    }

    onStatus('recording');
  }

  stop(): string {
    this.isActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.onStatus?.('stopped');
    return this.transcript;
  }

  getCurrentTranscript(): string {
    return this.transcript;
  }

  setTranscript(text: string): void {
    this.transcript = text;
    this.onTranscript?.(text, true);
  }

  isRecording(): boolean {
    return this.isActive;
  }

  destroy(): void {
    this.stop();
    this.onTranscript = null;
    this.onStatus = null;
    this.transcript = '';
  }
}
