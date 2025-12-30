/**
 * CelebrationMessage Component
 * Displays encouraging messages when tasks are completed
 */

'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface CelebrationMessageProps {
    message: string | null;
}

export function CelebrationMessage({ message }: CelebrationMessageProps) {
    if (!message) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
                <Sparkles size={20} className="animate-pulse" />
                <span className="font-semibold text-lg">{message}</span>
                <Sparkles size={20} className="animate-pulse" />
            </div>
        </div>
    );
}
