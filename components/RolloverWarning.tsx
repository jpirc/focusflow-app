/**
 * RolloverWarning Component
 * Shows a warning badge and action menu for tasks that have rolled over 3+ times
 * Helps users make decisions about stuck tasks
 */

'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Scissors, Archive, Sparkles } from 'lucide-react';

interface RolloverWarningProps {
    rolloverCount: number;
    onBreakdown: () => void;
    onArchive: () => void;
    compact?: boolean;
}

export function RolloverWarning({ 
    rolloverCount, 
    onBreakdown, 
    onArchive,
    compact = false 
}: RolloverWarningProps) {
    const [showMenu, setShowMenu] = useState(false);

    if (rolloverCount < 3) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`flex items-center gap-1 ${
                    compact ? 'px-1 py-0.5' : 'px-1.5 py-0.5'
                } bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded text-amber-700 transition-colors`}
                title="This task has rolled over multiple times. Click for options."
            >
                <AlertTriangle size={compact ? 10 : 12} />
                {!compact && (
                    <span className="text-[10px] font-medium">
                        {rolloverCount}x
                    </span>
                )}
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowMenu(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="p-2 bg-amber-50 border-b border-amber-200">
                            <div className="flex items-center gap-1.5 text-amber-800">
                                <AlertTriangle size={14} />
                                <span className="text-xs font-semibold">Stuck Task Alert</span>
                            </div>
                            <p className="text-[10px] text-amber-600 mt-0.5">
                                Rolled over {rolloverCount} times. Maybe it&apos;s time to...
                            </p>
                        </div>

                        <div className="p-1">
                            <button
                                onClick={() => {
                                    onBreakdown();
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-purple-50 rounded transition-colors group"
                            >
                                <Scissors size={14} className="text-purple-600" />
                                <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-900">Break it down</div>
                                    <div className="text-[10px] text-gray-500">Split into smaller subtasks</div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    onArchive();
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-50 rounded transition-colors group"
                            >
                                <Archive size={14} className="text-gray-600" />
                                <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-900">Archive it</div>
                                    <div className="text-[10px] text-gray-500">Maybe not worth doing</div>
                                </div>
                            </button>
                        </div>

                        <div className="p-2 bg-gray-50 border-t border-gray-200">
                            <p className="text-[9px] text-gray-500 italic">
                                💡 Pro tip: If a task keeps rolling over, it&apos;s either too big or not important enough.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
