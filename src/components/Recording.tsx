import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, Mic, CheckCircle, AlertCircle } from "lucide-react";
import { speechToTextService } from "../services/speechToText";
import { aiResponseService } from "../services/aiResponse";

type Props = {
  onComplete: (blob: Blob | null, transcribedText?: string) => void;
  onCancel?: () => void;
  maxSeconds?: number;
};

export default function Recording({
  onComplete,
  onCancel,
  maxSeconds = 90,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [transcriptionError, setTranscriptionError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pausedByTTSRef = useRef<boolean>(false);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      // If no recorder, still call onComplete(null)
      onComplete(null);
    }
    setRecording(false);
  }, [onComplete]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: chunksRef.current[0]?.type || "audio/webm",
        });
        
        // Start transcription process
        setTranscribing(true);
        setTranscriptionError('');
        
        try {
          const transcribedText = await speechToTextService.transcribeFromBlob(blob);
          setTranscribedText(transcribedText);
          onComplete(blob, transcribedText);
        } catch (error) {
          console.error('Transcription error:', error);
          setTranscriptionError(error instanceof Error ? error.message : 'Transcription failed');
          onComplete(blob, '');
        } finally {
          setTranscribing(false);
        }
        
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mr.start();
      setRecording(true);
      setSeconds(0);

      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= maxSeconds) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone permission error", err);
      setPermissionDenied(true);
      onComplete(null);
    }
  }, [onComplete, maxSeconds, stopRecording]);

  useEffect(() => {
    // Auto-start recording when component mounts
    startRecording();
    
    // Pause/resume recording based on TTS speaking status to avoid capturing AI voice
    const unsubscribeTTS = aiResponseService.onTTSStatusChange((status) => {
      const mr = mediaRecorderRef.current;
      const stream = streamRef.current;

      if (status === 'speaking') {
        // Pause active recording and mute mic track
        if (mr && mr.state === 'recording') {
          try { mr.pause(); } catch {}
          pausedByTTSRef.current = true;
        }
        if (stream) {
          stream.getAudioTracks().forEach(t => (t.enabled = false));
        }
      }

      if (status === 'idle' || status === 'stopped') {
        // Resume only if we paused due to TTS and recording is still ongoing
        if (stream) {
          stream.getAudioTracks().forEach(t => (t.enabled = true));
        }
        if (pausedByTTSRef.current && mr && mr.state === 'paused') {
          try { mr.resume(); } catch {}
          pausedByTTSRef.current = false;
        }
      }
    });

    return () => {
      // cleanup on unmount
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      unsubscribeTTS();
    };
  }, [startRecording]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {!recording && !transcribing ? (
          <div className="flex items-center gap-3">
            <div className="text-lg text-slate-600">Starting recording...</div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="rounded-lg bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300 transition-colors"
                aria-label="Cancel recording"
              >
                Cancel
              </button>
            )}
          </div>
        ) : recording ? (
          <>
            <div className="text-3xl font-mono text-slate-900 min-w-[100px]">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </div>
            <div
              className="flex-1 flex items-center gap-1 px-4"
              style={{ maxWidth: 400 }}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>

            <button
              onClick={stopRecording}
              className="rounded-full bg-red-500 p-4 text-white hover:bg-red-600 transition-colors shadow-lg"
              aria-label="Stop recording"
            >
              <Phone className="h-5 w-5" />
            </button>
          </>
        ) : transcribing ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-600 animate-pulse" />
              <div className="text-lg text-slate-600">Transcribing audio...</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Transcription Results */}
      {transcribedText && (
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-700">Transcription:</span>
          </div>
          <p className="text-slate-800 italic">"{transcribedText}"</p>
        </div>
      )}

      {/* Transcription Error */}
      {transcriptionError && (
        <div className="rounded-lg border border-red-200 p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Transcription Error:</span>
          </div>
          <p className="text-red-600 text-sm">{transcriptionError}</p>
        </div>
      )}

      {permissionDenied && (
        <p className="text-sm text-red-600">
          Microphone permission denied. Please enable microphone access for this
          site and try again.
        </p>
      )}
    </div>
  );
}
