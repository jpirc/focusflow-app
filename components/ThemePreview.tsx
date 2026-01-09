/**
 * Theme Preview Component
 * Shows a visual preview of what each theme looks like
 */

import React from 'react';
import { Theme } from '@/lib/themes';

interface ThemePreviewProps {
    theme: Theme;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
    return (
        <div className="space-y-2">
            {/* Header/Active Task Preview */}
            <div 
                className="h-8 rounded flex items-center px-2"
                style={{
                    backgroundImage: `linear-gradient(to right, ${theme.colors.primaryFrom}, ${theme.colors.primaryTo})`
                }}
            >
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-2" />
                <div className="flex-1 h-2 bg-white/30 rounded" />
            </div>
            
            {/* Top 3 Section Preview */}
            <div 
                className="h-12 rounded border flex items-center justify-center gap-2 px-2"
                style={{
                    backgroundImage: `linear-gradient(to bottom right, ${theme.colors.accentFrom}, ${theme.colors.accentTo})`,
                    borderColor: theme.colors.accentBorder
                }}
            >
                <div className="flex-1 h-2 bg-gray-300 rounded" />
                <div className="flex-1 h-2 bg-gray-300 rounded" />
                <div className="flex-1 h-2 bg-gray-300 rounded" />
            </div>
            
            {/* Drag State Preview */}
            <div 
                className="h-8 rounded border-2 flex items-center px-2"
                style={{
                    borderColor: theme.colors.dragBorder,
                    backgroundColor: theme.colors.dragBg
                }}
            >
                <div className="flex-1 h-2 bg-gray-400 rounded" />
            </div>
        </div>
    );
}
