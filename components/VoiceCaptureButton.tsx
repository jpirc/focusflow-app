'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceCapture, VoiceCaptureResult } from '@/hooks/useVoiceCapture';

/**
 * Voice Capture Button - Accessible mic button for voice input
 *
 * Accessibility:
 *   - ARIA labels for screen readers
 *   - Keyboard activation (Enter/Space)
 *   - Visual recording state indicator
 *   - Screen reader announcements for state changes
 *
 * Browser Support:
 *   - Hidden entirely on unsupported browsers (Firefox)
 *   - Uses webkit prefix for Safari
 */

interface VoiceCaptureButtonProps {
  onTranscript: (result: VoiceCaptureResult) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceCaptureButton({
  onTranscript,
  onError,
  disabled = false,
  className = '',
}: VoiceCaptureButtonProps) {
  const {
    isSupported,
    isRecording,
    isProcessing,
    error,
    errorMessage,
    startRecording,
    stopRecording,
    clearError,
    result,
    clearResult,
  } = useVoiceCapture();

  // Ref for screen reader announcements
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce state changes to screen readers
  const announce = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  // Handle result
  useEffect(() => {
    if (result) {
      onTranscript(result);
      if (result.isLowConfidence) {
        announce('Voice captured with low confidence. Please review the text.');
      } else {
        announce('Voice captured successfully.');
      }
      clearResult();
    }
  }, [result, onTranscript, clearResult]);

  // Handle errors
  useEffect(() => {
    if (error && errorMessage) {
      onError?.(errorMessage);
      announce(errorMessage);
      clearError();
    }
  }, [error, errorMessage, onError, clearError]);

  // Handle recording state announcements
  useEffect(() => {
    if (isRecording) {
      announce('Recording. Speak now.');
    }
  }, [isRecording]);

  // Don't render on unsupported browsers
  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (disabled) return;

    if (isRecording) {
      stopRecording();
      announce('Recording stopped.');
    } else {
      startRecording();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  // Determine button state for styling
  const isActive = isRecording || isProcessing;
  const isDisabled = disabled || isProcessing;

  // Build aria-label based on state
  let ariaLabel = 'Start voice capture';
  if (isRecording) {
    ariaLabel = 'Stop recording';
  } else if (isProcessing) {
    ariaLabel = 'Processing voice...';
  }

  return (
    <>
      {/* Screen reader announcements (live region) */}
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-pressed={isRecording}
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-full
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {/* Recording pulse animation */}
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"
            aria-hidden="true"
          />
        )}

        {/* Icon */}
        <span className="relative z-10">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Mic className="w-5 h-5" aria-hidden="true" />
          )}
        </span>
      </button>
    </>
  );
}
