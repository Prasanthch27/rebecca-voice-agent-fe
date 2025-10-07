import type { TTSStatus } from '../types/websocket';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export interface TTSControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  resume: () => void;
}

class TextToSpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private status: TTSStatus = 'idle';
  private onStatusChangeCallback?: (status: TTSStatus) => void;
  private isSupported: boolean = false;

  constructor() {
    this.initializeTTS();
  }

  private initializeTTS(): void {
    this.isSupported = 'speechSynthesis' in window;
  }

  isAvailable(): boolean {
    return this.isSupported;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  onStatusChange(callback: (status: TTSStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  private updateStatus(newStatus: TTSStatus): void {
    this.status = newStatus;
    this.onStatusChangeCallback?.(newStatus);
  }

  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Text-to-speech is not supported in this browser'));
        return;
      }

      // Stop any current speech
      this.stop();

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      this.currentUtterance.rate = options.rate || 1;
      this.currentUtterance.pitch = options.pitch || 1;
      this.currentUtterance.volume = options.volume || 1;
      
      if (options.voice) {
        this.currentUtterance.voice = options.voice;
      }

      // Event handlers
      this.currentUtterance.onstart = () => {
        this.updateStatus('speaking');
      };

      this.currentUtterance.onend = () => {
        this.updateStatus('idle');
        this.currentUtterance = null;
        resolve();
      };

      this.currentUtterance.onerror = (event) => {
        this.updateStatus('idle');
        this.currentUtterance = null;
        reject(new Error(`TTS error: ${event.error}`));
      };

      this.currentUtterance.onpause = () => {
        this.updateStatus('paused');
      };

      this.currentUtterance.onresume = () => {
        this.updateStatus('speaking');
      };

      // Start speaking
      speechSynthesis.speak(this.currentUtterance);
    });
  }

  pause(): void {
    if (this.isSupported && speechSynthesis.speaking) {
      speechSynthesis.pause();
      this.updateStatus('paused');
    }
  }

  resume(): void {
    if (this.isSupported && speechSynthesis.paused) {
      speechSynthesis.resume();
      this.updateStatus('speaking');
    }
  }

  stop(): void {
    if (this.isSupported) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
      this.updateStatus('stopped');
    }
  }

  getStatus(): TTSStatus {
    return this.status;
  }

  isSpeaking(): boolean {
    return speechSynthesis.speaking;
  }

  isPaused(): boolean {
    return speechSynthesis.paused;
  }

  // Get available voices and filter for English
  getEnglishVoices(): SpeechSynthesisVoice[] {
    const voices = this.getVoices();
    return voices.filter(voice => 
      voice.lang.startsWith('en') && 
      voice.name.toLowerCase().includes('english')
    );
  }

  // Get the best available English voice
  getBestEnglishVoice(): SpeechSynthesisVoice | null {
    const englishVoices = this.getEnglishVoices();
    
    // Prefer female voices, then male voices
    const femaleVoice = englishVoices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman')
    );
    
    if (femaleVoice) return femaleVoice;
    
    // Fallback to any English voice
    return englishVoices[0] || null;
  }
}

export const textToSpeechService = new TextToSpeechService();
