export interface SpeechToTextResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;
  private isBlocked: boolean = false;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.isSupported = true;
        this.setupRecognition();
      }
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  // Block speech recognition (when AI is speaking)
  blockRecognition(): void {
    this.isBlocked = true;
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // Unblock speech recognition (when AI stops speaking)
  unblockRecognition(): void {
    this.isBlocked = false;
  }

  // Check if recognition is blocked
  isRecognitionBlocked(): boolean {
    return this.isBlocked;
  }

  async transcribeAudio(_audioBlob: Blob, _options: SpeechToTextOptions = {}): Promise<string> {
    if (!this.isSupported) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized'));
        return;
      }

      let finalTranscript = '';
      let timeoutId: number;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (this.recognition) {
          this.recognition.onresult = null;
          this.recognition.onerror = null;
          this.recognition.onend = null;
        }
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Clear timeout on new results
        if (timeoutId) clearTimeout(timeoutId);
        
        // Set a timeout to stop recognition if no new results
        timeoutId = setTimeout(() => {
          if (this.recognition) {
            this.recognition.stop();
          }
        }, 2000);
      };

      this.recognition.onerror = (event) => {
        cleanup();
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        cleanup();
        resolve(finalTranscript.trim() || 'No speech detected');
      };

      // Start recognition
      try {
        this.recognition.start();
      } catch (error) {
        cleanup();
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  async transcribeFromBlob(_audioBlob: Blob): Promise<string> {
    // For audio blob transcription, we'll use a different approach
    // This is a simplified implementation - in a real app, you might use
    // a service like Google Cloud Speech-to-Text or Azure Speech Services
    
    // For now, we'll simulate the transcription process
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        resolve("This is a simulated transcription of the audio recording. In a real implementation, you would use a speech-to-text API to convert the audio blob to text.");
      }, 2000);
    });
  }

  startListening(
    onResult: (result: SpeechToTextResult) => void,
    onError: (error: string) => void,
    options: SpeechToTextOptions = {}
  ): void {
    if (!this.isSupported || !this.recognition) {
      onError('Speech recognition is not supported');
      return;
    }

    // Don't start if blocked
    if (this.isBlocked) {
      console.log('Speech recognition is blocked - AI is speaking');
      return;
    }

    this.recognition.continuous = options.continuous || true;
    this.recognition.interimResults = options.interimResults || true;
    this.recognition.lang = options.language || 'en-US';

    this.recognition.onresult = (event) => {
      // Double-check if blocked during processing
      if (this.isBlocked) {
        console.log('Speech recognition blocked during processing - ignoring result');
        return;
      }

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        // Filter out low confidence results that might be AI voice
        if (confidence < 0.3) {
          continue;
        }
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Only process if we have meaningful content and not blocked
      const resultText = finalTranscript || interimTranscript;
      if (resultText.trim() && !this.isBlocked) {
        onResult({
          text: resultText,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
          isFinal: event.results[event.results.length - 1]?.isFinal || false
        });
      }
    };

    this.recognition.onerror = (event) => {
      onError(`Speech recognition error: ${event.error}`);
    };

    this.recognition.onend = () => {
      // Auto-restart for continuous listening only if not blocked
      if (this.recognition && this.recognition.continuous && !this.isBlocked) {
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Failed to restart speech recognition:', error);
        }
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError('Failed to start speech recognition');
    }
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export const speechToTextService = new SpeechToTextService();
