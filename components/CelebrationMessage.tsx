/**
 * CelebrationMessage Component
 * Displays encouraging messages when tasks are completed
 */

'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Theme } from '@/lib/themes';

interface CelebrationMessageProps {
    message: string | null;
    theme?: Theme;
}

export function CelebrationMessage({ message, theme }: CelebrationMessageProps) {
    if (!message) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
            <div 
                className="text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
                style={{
                    backgroundImage: `linear-gradient(to right, ${theme?.colors.primaryFrom || '#2563eb'}, ${theme?.colors.primaryTo || '#0891b2'})`
                }}
            >
                <Sparkles size={20} className="animate-pulse" />
                <span className="font-semibold text-lg">{message}</span>
                <Sparkles size={20} className="animate-pulse" />
            </div>
        </div>
    );
}
