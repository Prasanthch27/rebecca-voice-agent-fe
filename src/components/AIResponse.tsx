import { useState, useEffect } from 'react';
import type { Product } from '../types/websocket';
import { aiResponseService } from '../services/aiResponse';
import TTSControls from './TTSControls';
import { Bot, ShoppingBag, ExternalLink } from 'lucide-react';

interface AIResponseProps {
  onReset: () => void;
  className?: string;
}

export default function AIResponse({ onReset, className = '' }: AIResponseProps) {
  const [message, setMessage] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const response = aiResponseService.getCurrentResponse();
    if (response) {
      setMessage(response.data.message);
      setProducts(response.data.products);
      setSessionId(response.data.session_id);
    }
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Message */}
      <div className="rounded-2xl border-2 border-blue-200 p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">AI Assistant</h3>
              <TTSControls />
            </div>
            <p className="text-slate-700 leading-relaxed">{message}</p>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Recommended Products</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-slate-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900 line-clamp-2">{product.name}</h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900">{formatPrice(product.price)}</span>
                    {product.url && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Info */}
      {sessionId && (
        <div className="text-xs text-slate-500 text-center">
          Session ID: {sessionId}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onReset}
          className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Ask Another Question
        </button>
        <button
          onClick={() => aiResponseService.clearResponse()}
          className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
