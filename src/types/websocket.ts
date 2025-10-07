export interface WebSocketMessage {
  type: 'query' | 'response' | 'error';
  data?: any;
}

export interface AIResponse {
  type: 'response';
  data: {
    message: string;
    products: Product[];
    session_id: string;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  flavor_notes: string[];
  category: string;
  roast_level: string;
  url: string;
  image_url: string;
  relevance_score: number;
  reason: string;
}

export interface WebSocketQuery {
  type: 'message';
  data: {
    message: string;
    session_id?: string;
  };
}

export type WebSocketConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type TTSStatus = 'idle' | 'speaking' | 'paused' | 'stopped';
export type ProcessingStatus = 'idle' | 'transcribing' | 'querying' | 'speaking' | 'complete';
