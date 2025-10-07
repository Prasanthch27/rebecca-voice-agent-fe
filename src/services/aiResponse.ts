import type { AIResponse, Product, TTSStatus } from '../types/websocket';
import { textToSpeechService } from './textToSpeech';
import { websocketService } from './websocket';

export interface AIResponseHandler {
  onResponse: (response: AIResponse) => void;
  onError: (error: string) => void;
  onTTSStatusChange: (status: string) => void;
}

class AIResponseService {
  private currentResponse: AIResponse | null = null;
  private sessionId: string | null = null;
  private responseListeners: Array<(response: AIResponse) => void> = [];
  private ttsStatusListeners: Array<(status: TTSStatus) => void> = [];

  constructor() {
    this.setupWebSocketHandlers();
    textToSpeechService.onStatusChange((status) => {
      this.ttsStatusListeners.forEach((listener) => listener(status));
    });
  }

  private setupWebSocketHandlers(): void {
    websocketService.onMessage((response: AIResponse) => {
      this.handleAIResponse(response);
    });

    websocketService.onStatusChange((status) => {
      if (status === 'error') {
        console.error('WebSocket connection error');
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await websocketService.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  disconnect(): void {
    // Stop TTS first
    this.stopTTS();
    
    // Clear current response
    this.clearResponse();
    
    // Disconnect WebSocket
    websocketService.disconnect();
  }

  async sendQuery(text: string): Promise<void> {
    if (!text.trim()) {
      throw new Error('Query text cannot be empty');
    }

    try {
      websocketService.sendQuery(text, this.sessionId || undefined);
    } catch (error) {
      console.error('Failed to send query:', error);
      throw error;
    }
  }

  private handleAIResponse(response: AIResponse): void {
    this.currentResponse = response;
    this.sessionId = response.data.session_id;
    
    // Automatically speak the AI message
    this.speakMessage(response.data.message);

    // Notify listeners
    this.responseListeners.forEach((listener) => listener(response));
  }

  async speakMessage(message: string): Promise<void> {
    if (!message.trim()) return;

    try {
      const bestVoice = textToSpeechService.getBestEnglishVoice();
      await textToSpeechService.speak(message, {
        voice: bestVoice,
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8
      });
    } catch (error) {
      console.error('Failed to speak message:', error);
    }
  }

  getCurrentResponse(): AIResponse | null {
    return this.currentResponse;
  }

  getProducts(): Product[] {
    return this.currentResponse?.data.products || [];
  }

  getMessage(): string {
    return this.currentResponse?.data.message || '';
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  // TTS Controls
  pauseTTS(): void {
    textToSpeechService.pause();
  }

  resumeTTS(): void {
    textToSpeechService.resume();
  }

  stopTTS(): void {
    textToSpeechService.stop();
  }

  isSpeaking(): boolean {
    return textToSpeechService.isSpeaking();
  }

  isPaused(): boolean {
    return textToSpeechService.isPaused();
  }

  getTTSStatus(): string {
    return textToSpeechService.getStatus();
  }

  // Clear current response
  clearResponse(): void {
    this.currentResponse = null;
    this.sessionId = null;
    this.stopTTS();
  }

  // Subscriptions
  onResponse(callback: (response: AIResponse) => void): () => void {
    this.responseListeners.push(callback);
    return () => {
      this.responseListeners = this.responseListeners.filter((cb) => cb !== callback);
    };
  }

  onTTSStatusChange(callback: (status: TTSStatus) => void): () => void {
    this.ttsStatusListeners.push(callback);
    return () => {
      this.ttsStatusListeners = this.ttsStatusListeners.filter((cb) => cb !== callback);
    };
  }
}

export const aiResponseService = new AIResponseService();
