/**
 * StartNowButton - Single-click task activation
 *
 * Reduces activation energy from 5 steps to 1:
 * - Schedules task at current time
 * - Sets status to in-progress
 * - Updates UI optimistically
 */

'use client';

import React, { useState } from 'react';
import { Zap, Check, AlertCircle } from 'lucide-react';

export interface StartNowButtonProps {
    /** Callback when button is clicked - should handle all the start logic */
    onStartNow: () => Promise<void>;
    /** Button size variant */
    size?: 'xs' | 'sm' | 'md';
    /** Show label or just icon */
    showLabel?: boolean;
    /** Custom className for positioning */
    className?: string;
    /** Disable the button */
    disabled?: boolean;
}

export const StartNowButton: React.FC<StartNowButtonProps> = ({
    onStartNow,
    size = 'sm',
    showLabel = true,
    className = '',
    disabled = false,
}) => {
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (disabled || state === 'loading') return;

        setState('loading');

        try {
            await onStartNow();
            setState('success');

            // Reset to idle after brief success state
            setTimeout(() => setState('idle'), 1500);
        } catch (error) {
            console.error('Start Now failed:', error);
            setState('error');

            // Reset to idle after showing error
            setTimeout(() => setState('idle'), 2000);
        }
    };

    // Size classes
    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
        sm: 'px-2 py-1 text-xs gap-1',
        md: 'px-3 py-1.5 text-sm gap-1.5',
    };

    const iconSizes = {
        xs: 10,
        sm: 12,
        md: 14,
    };

    // State-based styling
    const getStateClasses = () => {
        if (disabled) {
            return 'bg-gray-100 text-gray-400 cursor-not-allowed';
        }

        switch (state) {
            case 'loading':
                return 'bg-purple-500 text-white cursor-wait';
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'idle':
            default:
                return 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 active:scale-95';
        }
    };

    const getContent = () => {
        const iconSize = iconSizes[size];

        switch (state) {
            case 'loading':
                return (
                    <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {showLabel && <span>Starting...</span>}
                    </>
                );
            case 'success':
                return (
                    <>
                        <Check size={iconSize} className="animate-scale-in" />
                        {showLabel && <span>Started!</span>}
                    </>
                );
            case 'error':
                return (
                    <>
                        <AlertCircle size={iconSize} />
                        {showLabel && <span>Error</span>}
                    </>
                );
            case 'idle':
            default:
                return (
                    <>
                        <Zap size={iconSize} className="fill-current" />
                        {showLabel && <span>Start Now</span>}
                    </>
                );
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || state === 'loading'}
            className={`
                flex items-center justify-center
                ${sizeClasses[size]}
                ${getStateClasses()}
                rounded-lg font-semibold
                transition-all duration-200
                shadow-sm hover:shadow-md
                disabled:shadow-none
                ${className}
            `}
            title={disabled ? 'Already started' : 'Start this task now'}
        >
            {getContent()}
        </button>
    );
};

// Add scale-in animation to tailwind (or use existing)
// In your global CSS, add:
// @keyframes scale-in {
//   0% { transform: scale(0); }
//   50% { transform: scale(1.2); }
//   100% { transform: scale(1); }
// }
// .animate-scale-in { animation: scale-in 0.3s ease-out; }
