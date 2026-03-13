'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Voice Capture Hook - Web Speech API Wrapper
 *
 * Flow:
 *   ┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
 *   │ Tap Mic │───▶│ Check Perms  │───▶│  Recording  │───▶│ Transcript   │
 *   └─────────┘    └──────────────┘    └─────────────┘    └──────────────┘
 *        │              │                    │                   │
 *        ▼              ▼                    ▼                   ▼
 *   [debounce]     [denied]            [no speech]         [append text]
 *                  [unsupported]       [low confidence]
 *
 * Browser Support:
 *   ✅ Chrome/Edge: Full support
 *   ⚠️ Safari: Partial (webkit prefix)
 *   ❌ Firefox: No support (mic button hidden)
 */

// Web Speech API type definitions (not in all TypeScript libs)
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Confidence threshold - below this, show warning badge
const CONFIDENCE_THRESHOLD = 0.7;

// Timeout for no speech detection (ms)
const NO_SPEECH_TIMEOUT = 5000;

export type VoiceCaptureError =
  | 'unsupported'
  | 'permission-denied'
  | 'mic-unavailable'
  | 'no-speech'
  | 'aborted'
  | 'network'
  | 'unknown';

export interface VoiceCaptureResult {
  transcript: string;
  confidence: number;
  isLowConfidence: boolean;
}

export interface UseVoiceCaptureReturn {
  // State
  isSupported: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  error: VoiceCaptureError | null;
  errorMessage: string | null;

  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  clearError: () => void;

  // Results
  result: VoiceCaptureResult | null;
  clearResult: () => void;
}

// Get SpeechRecognition constructor (handles webkit prefix for Safari)
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;

  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition ||
    null
  );
}

// Map Web Speech API errors to our error types
function mapSpeechError(error: string): VoiceCaptureError {
  switch (error) {
    case 'not-allowed':
      return 'permission-denied';
    case 'audio-capture':
    case 'no-speech':
      return error as VoiceCaptureError;
    case 'aborted':
      return 'aborted';
    case 'network':
      return 'network';
    default:
      return 'unknown';
  }
}

// Get user-friendly error message
function getErrorMessage(error: VoiceCaptureError): string {
  switch (error) {
    case 'unsupported':
      return 'Voice capture is not supported in this browser.';
    case 'permission-denied':
      return 'Microphone access denied. Please check your browser settings.';
    case 'mic-unavailable':
      return 'Microphone unavailable. Please close other apps using it.';
    case 'no-speech':
      return 'No speech detected. Tap the mic to try again.';
    case 'aborted':
      return 'Recording was interrupted. Please try again.';
    case 'network':
      return 'Network error. Please check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function useVoiceCapture(): UseVoiceCaptureReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<VoiceCaptureError | null>(null);
  const [result, setResult] = useState<VoiceCaptureResult | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track if we intentionally aborted to start a new recording
  const intentionalAbortRef = useRef(false);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    setIsSupported(SpeechRecognitionClass !== null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    // Reset state
    setError(null);
    setResult(null);

    const SpeechRecognitionClass = getSpeechRecognition();

    if (!SpeechRecognitionClass) {
      setError('unsupported');
      return;
    }

    // Stop any existing recording (mark as intentional to suppress error)
    if (recognitionRef.current) {
      intentionalAbortRef.current = true;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = false; // Stop after first result
      recognition.interimResults = false; // Only final results
      recognition.lang = navigator.language || 'en-US';
      recognition.maxAlternatives = 1;

      // Handle successful result
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        const confidence = lastResult[0].confidence;

        if (!transcript) {
          setError('no-speech');
          setIsRecording(false);
          return;
        }

        setResult({
          transcript,
          confidence,
          isLowConfidence: confidence < CONFIDENCE_THRESHOLD,
        });
        setIsRecording(false);
      };

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Ignore aborted errors if we intentionally aborted (e.g., to restart)
        if (event.error === 'aborted' && intentionalAbortRef.current) {
          intentionalAbortRef.current = false;
          return;
        }

        const errorType = mapSpeechError(event.error);

        // Map audio-capture to mic-unavailable for clearer messaging
        if (event.error === 'audio-capture') {
          setError('mic-unavailable');
        } else {
          setError(errorType);
        }

        setIsRecording(false);
      };

      // Handle end of recognition
      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
      };

      // Handle start
      recognition.onstart = () => {
        // Clear intentional abort flag - we successfully started
        intentionalAbortRef.current = false;
        setIsRecording(true);
        setIsProcessing(false);

        // Set timeout for no speech
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.abort();
            setError('no-speech');
            setIsRecording(false);
          }
        }, NO_SPEECH_TIMEOUT);
      };

      // Handle audio start (processing phase)
      recognition.onaudiostart = () => {
        setIsProcessing(true);
      };

      // Start recognition
      recognition.start();
    } catch (err) {
      console.error('[useVoiceCapture] Failed to start recording:', err);
      setError('unknown');
      setIsRecording(false);
    }
  }, []);

  return {
    isSupported,
    isRecording,
    isProcessing,
    error,
    errorMessage: error ? getErrorMessage(error) : null,
    startRecording,
    stopRecording,
    clearError,
    result,
    clearResult,
  };
}
