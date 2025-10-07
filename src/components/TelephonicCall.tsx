import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, VolumeX } from 'lucide-react';
import { aiResponseService } from '../services/aiResponse';
import { speechToTextService } from '../services/speechToText';
import ConnectionStatus from './ConnectionStatus';
import WebSocketDebug from './WebSocketDebug';
import type { WebSocketConnectionStatus, Product } from '../types/websocket';

interface TelephonicCallProps {
  name: string;
  email: string;
  onEndCall: () => void;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isPlaying?: boolean;
}

export default function TelephonicCall({ name, email: _email, onEndCall }: TelephonicCallProps) {
  const [callStatus, setCallStatus] = useState<'connecting' | 'greeting' | 'listening' | 'processing' | 'speaking' | 'ended'>('connecting');
  const [wsConnectionStatus, setWsConnectionStatus] = useState<WebSocketConnectionStatus>('disconnected');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  // Auto-scroll conversation to bottom
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, products]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      aiResponseService.stopTTS();
      speechToTextService.stopListening();
      speechToTextService.unblockRecognition();
      aiResponseService.disconnect();
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // Initialize call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        await aiResponseService.connect();
        setWsConnectionStatus('connected');
        setCallStatus('greeting');
        
        // Play greeting
        const greetingMessage = `Hello ${name}! I'm Rebecca, your AI assistant. I'm ready to help you find the perfect coffee. Please tell me what you're looking for.`;
        await aiResponseService.speakMessage(greetingMessage);
        
        // Add greeting to conversation
        addToConversation('ai', greetingMessage);
        
        // Start listening mode
        setCallStatus('listening');
        startContinuousListening();
        
      } catch (error) {
        console.error('Failed to initialize call:', error);
        setWsConnectionStatus('error');
      }
    };

    initializeCall();
  }, [name]);

  // Subscribe to AI responses and TTS status
  useEffect(() => {
    const unsubscribeResponse = aiResponseService.onResponse((response) => {
      setCallStatus('speaking');
      // Store products instead of adding AI message to conversation
      setProducts(response.data.products || []);
    });

    const unsubscribeTTS = aiResponseService.onTTSStatusChange((status) => {
      if (status === 'speaking') {
        // Block speech recognition completely while AI is speaking
        speechToTextService.blockRecognition();
        speechToTextService.stopListening();
        setIsListening(false);
        
        // Clear any pending silence timeout to prevent processing during AI speech
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
      if (status === 'idle' || status === 'stopped') {
        // Unblock speech recognition when AI stops speaking
        speechToTextService.unblockRecognition();
        
        // Only resume listening if call is still active and not ended
        if (callStatus !== 'ended' && callStatus !== 'processing') {
          setCallStatus('listening');
          startContinuousListening();
        }
      }
    });

    return () => {
      unsubscribeResponse();
      unsubscribeTTS();
    };
  }, [callStatus]);

  const addToConversation = (type: 'user' | 'ai', text: string, isPlaying = false) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
      isPlaying
    };
    setConversation(prev => [...prev, message]);
  };

  const startContinuousListening = () => {
    if (!speechToTextService.isAvailable()) {
      console.error('Speech recognition not available');
      return;
    }

    // Don't start if recognition is blocked (AI is speaking)
    if (speechToTextService.isRecognitionBlocked()) {
      console.log('Speech recognition is blocked - AI is speaking');
      return;
    }

    setIsListening(true);
    
    speechToTextService.startListening(
      (result) => {
        // Check if recognition is blocked before processing
        if (speechToTextService.isRecognitionBlocked()) {
          console.log('Speech result ignored - AI is speaking');
          return;
        }
        
        setCurrentTranscript(result.text);
        
        // Reset silence timeout on new speech
        if (result.text.trim()) {
          lastSoundTimeRef.current = Date.now();
          
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          
          // Set timeout for silence detection (2 seconds of silence)
          silenceTimeoutRef.current = window.setTimeout(() => {
            if (result.text.trim() && !speechToTextService.isRecognitionBlocked()) {
              handleVoiceBreak(result.text);
            }
          }, 2000);
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      }
    );
  };

  const handleVoiceBreak = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Double-check if recognition is blocked (AI might have started speaking)
    if (speechToTextService.isRecognitionBlocked()) {
      console.log('Voice break ignored - AI is speaking');
      return;
    }
    
    setIsListening(false);
    setCallStatus('processing');
    setCurrentTranscript('');
    
    // Add user message to conversation
    addToConversation('user', transcript);
    
    // Stop speech recognition
    speechToTextService.stopListening();
    
    try {
      console.log('🎤 Sending transcript to WebSocket:', transcript);
      
      // Send to WebSocket
      await aiResponseService.sendQuery(transcript);
      
    } catch (error) {
      console.error('❌ Failed to process query:', error);
      setCallStatus('listening');
      startContinuousListening();
    }
  };

  const endCall = () => {
    // Stop all audio and recording
    aiResponseService.stopTTS();
    speechToTextService.stopListening();
    
    // Unblock recognition before disconnecting
    speechToTextService.unblockRecognition();
    
    // Disconnect WebSocket to stop all requests
    aiResponseService.disconnect();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clear any pending timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    setCallStatus('ended');
    onEndCall();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      startContinuousListening();
    } else {
      speechToTextService.stopListening();
      setIsListening(false);
    }
  };

  const getStatusMessage = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting to Rebecca...';
      case 'greeting':
        return 'Rebecca is greeting you...';
      case 'listening':
        return isListening ? 'AI is listening...' : 'Ready to listen';
      case 'processing':
        return 'Processing your message...';
      case 'speaking':
        return 'Rebecca is responding...';
      case 'ended':
        return 'Call ended';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
      case 'greeting':
        return 'text-blue-600';
      case 'listening':
        return 'text-green-600';
      case 'processing':
        return 'text-yellow-600';
      case 'speaking':
        return 'text-purple-600';
      case 'ended':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <WebSocketDebug />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Call Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Rebecca - AI Assistant</h2>
              <div className="flex items-center gap-2">
                <ConnectionStatus status={wsConnectionStatus} />
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusMessage()}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={endCall}
            className="rounded-full bg-red-500 p-3 text-white hover:bg-red-600 transition-colors"
            aria-label="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversation.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-70">
                    {message.type === 'user' ? 'You' : 'Rebecca'}
                  </span>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          
          {/* Products Display */}
          {products.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recommended Products</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-900 text-lg">{product.name}</h4>
                      <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Category:</span>
                        <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{product.category}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Roast Level:</span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">{product.roast_level}</span>
                      </div>
                      
                      {product.flavor_notes.length > 0 && (
                        <div>
                          <span className="font-medium">Flavor Notes:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.flavor_notes.map((note, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {product.description && (
                        <p className="text-slate-700 mt-2">{product.description}</p>
                      )}
                      
                      <div className="text-xs text-slate-500 mt-2">
                        <span className="font-medium">Relevance:</span> {Math.round(product.relevance_score * 100)}% - {product.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Current transcript */}
          {currentTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-blue-100 text-blue-900 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">Speaking...</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm italic">{currentTranscript}</p>
              </div>
            </div>
          )}
          
          <div ref={conversationEndRef} />
        </div>

        {/* Call Controls */}
        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`rounded-full p-4 transition-colors ${
                isMuted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            
            <button
              onClick={() => aiResponseService.stopTTS()}
              className="rounded-full bg-slate-200 p-4 text-slate-700 hover:bg-slate-300 transition-colors"
              aria-label="Stop speaking"
            >
              <VolumeX className="h-6 w-6" />
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">
              {isListening ? 'Speak naturally - I\'ll detect when you\'re done' : 'Click mic to start listening'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
