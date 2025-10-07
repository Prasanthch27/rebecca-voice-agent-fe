import type { WebSocketMessage, AIResponse, WebSocketQuery, WebSocketConnectionStatus } from '../types/websocket';

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onMessageCallback?: (message: AIResponse) => void;
  private onStatusChangeCallback?: (status: WebSocketConnectionStatus) => void;

  constructor(url: string = 'wss://4038973c8cf4.ngrok-free.app/ws') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.onStatusChangeCallback?.('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('📥 Received WebSocket message:', event.data);
            const message: WebSocketMessage = JSON.parse(event.data);
            if (message.type === 'response' && this.onMessageCallback) {
              console.log('✅ Processing AI response:', message);
              this.onMessageCallback(message as AIResponse);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.onStatusChangeCallback?.('disconnected');
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
          } else {
            this.onStatusChangeCallback?.('error');
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onStatusChangeCallback?.('error');
          reject(error);
        };

        this.onStatusChangeCallback?.('connecting');
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.onStatusChangeCallback?.('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      // Clear any pending reconnection attempts
      this.reconnectAttempts = this.maxReconnectAttempts;
      this.ws.close();
      this.ws = null;
      this.onStatusChangeCallback?.('disconnected');
    }
  }

  sendQuery(text: string, sessionId?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const query : WebSocketQuery = {
        type: 'message',
        data: {
          message: text,
          session_id: sessionId // Optional but recommended
        }
      };
      
      console.log('📤 Sending WebSocket query:', query);
      this.ws.send(JSON.stringify(query));
    } else {
      console.error('❌ WebSocket is not connected. State:', this.ws?.readyState);
    }
  }

  onMessage(callback: (message: AIResponse) => void): void {
    this.onMessageCallback = callback;
  }

  onStatusChange(callback: (status: WebSocketConnectionStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  getConnectionStatus(): WebSocketConnectionStatus {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }
}

export const websocketService = new WebSocketService();
