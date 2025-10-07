import { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { aiResponseService } from '../services/aiResponse';

interface TTSControlsProps {
  className?: string;
}

export default function TTSControls({ className = '' }: TTSControlsProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      setIsSpeaking(aiResponseService.isSpeaking());
      setIsPaused(aiResponseService.isPaused());
    };

    // Check status initially
    checkStatus();

    // Set up interval to check status
    const interval = setInterval(checkStatus, 500);

    return () => clearInterval(interval);
  }, []);

  const handlePlay = () => {
    if (isPaused) {
      aiResponseService.resumeTTS();
    } else {
      // If not speaking and not paused, we need to re-speak the message
      const message = aiResponseService.getMessage();
      if (message) {
        aiResponseService.speakMessage(message);
      }
    }
  };

  const handlePause = () => {
    aiResponseService.pauseTTS();
  };

  const handleStop = () => {
    aiResponseService.stopTTS();
  };

  const getButtonConfig = () => {
    if (isSpeaking && !isPaused) {
      return {
        primary: { icon: Pause, action: handlePause, label: 'Pause' },
        secondary: { icon: Square, action: handleStop, label: 'Stop' }
      };
    } else if (isPaused) {
      return {
        primary: { icon: Play, action: handlePlay, label: 'Resume' },
        secondary: { icon: Square, action: handleStop, label: 'Stop' }
      };
    } else {
      return {
        primary: { icon: Play, action: handlePlay, label: 'Play' },
        secondary: null
      };
    }
  };

  const config = getButtonConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Volume2 className="h-4 w-4 text-slate-600" />
        <span className="text-sm text-slate-600">AI Response:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={config.primary.action}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
          aria-label={config.primary.label}
        >
          <config.primary.icon className="h-4 w-4" />
          {config.primary.label}
        </button>

        {config.secondary && (
          <button
            onClick={config.secondary.action}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm font-medium"
            aria-label={config.secondary.label}
          >
            <config.secondary.icon className="h-4 w-4" />
            {config.secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}
