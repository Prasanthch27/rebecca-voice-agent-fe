import { useState, useEffect } from 'react';
import { websocketService } from '../services/websocket';
import { aiResponseService } from '../services/aiResponse';
import type { WebSocketConnectionStatus } from '../types/websocket';

interface WebSocketDebugProps {
  className?: string;
}

export default function WebSocketDebug({ className = '' }: WebSocketDebugProps) {
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<string>('');
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    // Listen for connection status changes
    websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Listen for AI responses via aiResponseService to avoid overriding the WebSocket handler
    const unsubscribeResponse = aiResponseService.onResponse((response) => {
      setLastMessage(JSON.stringify(response, null, 2));
      setMessageCount((prev) => prev + 1);
    });

    // Check current status
    setConnectionStatus(websocketService.getConnectionStatus());

    return () => {
      unsubscribeResponse();
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-blue-600';
      case 'disconnected': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚪';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-sm ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            WebSocket: {connectionStatus}
          </span>
        </div>
        
        <div className="text-xs text-slate-600">
          Messages received: {messageCount}
        </div>
        
        {lastMessage && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Last Response:</div>
            <pre className="text-xs bg-slate-50 p-2 rounded border overflow-auto max-h-32">
              {lastMessage}
            </pre>
          </div>
        )}
        
        <div className="text-xs text-slate-500">
          URL: wss://4038973c8cf4.ngrok-free.app/ws
        </div>
      </div>
    </div>
  );
}
