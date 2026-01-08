/**
 * SmartSuggestionBanner - Inline AI suggestions
 * Shows learned patterns and recommendations in context
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ArrowRight, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { SmartSuggestion } from '@/hooks/useIntelligence';

interface SmartSuggestionBannerProps {
    suggestions: SmartSuggestion[];
    onAccept: (suggestionId: string, action: any) => void;
    onDismiss: (suggestionId: string) => void;
    compact?: boolean;
}

export function SmartSuggestionBanner({ 
    suggestions, 
    onAccept, 
    onDismiss,
    compact = false 
}: SmartSuggestionBannerProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [justAccepted, setJustAccepted] = useState<string | null>(null);

    // Auto-expand first suggestion after 1s
    useEffect(() => {
        if (suggestions.length > 0 && !expandedId) {
            const timer = setTimeout(() => {
                setExpandedId(suggestions[0].id);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [suggestions, expandedId]);

    // Auto-collapse after 10s
    useEffect(() => {
        if (expandedId) {
            const timer = setTimeout(() => {
                setExpandedId(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [expandedId]);

    // Clear acceptance animation
    useEffect(() => {
        if (justAccepted) {
            const timer = setTimeout(() => {
                setJustAccepted(null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [justAccepted]);

    if (suggestions.length === 0) return null;

    const visibleSuggestions = compact ? suggestions.slice(0, 2) : suggestions.slice(0, 3);
    const hasMore = suggestions.length > visibleSuggestions.length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'time_block': return <TrendingUp size={12} />;
            case 'overload_warning': return <AlertTriangle size={12} />;
            case 'stale_task': return <Lightbulb size={12} />;
            default: return <Sparkles size={12} />;
        }
    };

    const getGradient = (confidence: number) => {
        if (confidence >= 0.8) return 'from-purple-500 to-blue-500';
        if (confidence >= 0.5) return 'from-blue-400 to-cyan-400';
        return 'from-gray-400 to-gray-500';
    };

    const getActionLabel = (action: any) => {
        switch (action.type) {
            case 'move_time_block': return `Move to ${action.targetTimeBlock}`;
            case 'breakdown': return 'Break it down';
            case 'dismiss': return 'Got it';
            case 'focus': return 'Start now';
            default: return 'Apply';
        }
    };

    return (
        <div className={`space-y-1 ${compact ? 'mb-1' : 'mb-1.5'}`}>
            {visibleSuggestions.map((suggestion, index) => {
                const isExpanded = expandedId === suggestion.id;
                const gradient = getGradient(suggestion.confidence);
                const wasAccepted = justAccepted === suggestion.id;

                return (
                    <div
                        key={suggestion.id}
                        className={`
                            relative overflow-hidden transition-all duration-150
                            ${isExpanded 
                                ? 'bg-white border-l-2 border-transparent' 
                                : 'bg-white/50 border-l border-gray-200 cursor-pointer hover:bg-white'
                            }
                            ${wasAccepted ? 'bg-green-50 border-green-400' : ''}
                        `}
                        style={{
                            borderLeftColor: isExpanded ? `rgb(147, 51, 234)` : undefined,
                        }}
                        onClick={() => !isExpanded && setExpandedId(suggestion.id)}
                    >
                        {/* Gradient border (only when expanded) */}
                        {isExpanded && (
                            <div 
                                className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-5 pointer-events-none`}
                            />
                        )}

                        <div className={`relative ${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'}`}>
                            {isExpanded ? (
                                // Expanded view
                                <div className="flex items-start gap-2">
                                    <div className={`flex-shrink-0 mt-0.5 text-purple-500`}>
                                        {getIcon(suggestion.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-gray-800 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                                            {suggestion.title}
                                        </p>
                                        {suggestion.reasoning && (
                                            <p className={`text-gray-500 mt-0.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                                                {suggestion.reasoning}
                                            </p>
                                        )}
                                        <div className={`flex items-center gap-1.5 ${compact ? 'mt-1' : 'mt-1.5'}`}>
                                            {suggestion.action.type !== 'dismiss' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setJustAccepted(suggestion.id);
                                                        onAccept(suggestion.id, suggestion.action);
                                                    }}
                                                    className={`
                                                        flex items-center gap-1 px-2 py-1
                                                        bg-gradient-to-r ${gradient}
                                                        text-white rounded
                                                        hover:opacity-90 transition-opacity
                                                        ${compact ? 'text-[9px]' : 'text-[10px]'}
                                                        font-medium
                                                    `}
                                                >
                                                    {getActionLabel(suggestion.action)}
                                                    <ArrowRight size={10} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDismiss(suggestion.id);
                                                }}
                                                className={`
                                                    px-2 py-1 text-gray-500 hover:text-gray-700
                                                    ${compact ? 'text-[9px]' : 'text-[10px]'}
                                                `}
                                            >
                                                Not now
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDismiss(suggestion.id);
                                        }}
                                        className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                // Collapsed view
                                <div className="flex items-center gap-1.5">
                                    <div className="flex-shrink-0 text-purple-400">
                                        <Lightbulb size={10} />
                                    </div>
                                    <p className={`flex-1 text-gray-600 truncate ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                                        {suggestion.title}
                                    </p>
                                    {suggestion.confidence >= 0.8 && (
                                        <span className="flex-shrink-0 text-[8px] text-purple-500 font-medium">
                                            {Math.round(suggestion.confidence * 100)}%
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* "More suggestions" indicator */}
            {hasMore && !expandedId && (
                <div 
                    className={`bg-purple-50 border-l border-purple-200 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} cursor-pointer hover:bg-purple-100 transition-colors`}
                    onClick={() => setExpandedId(suggestions[visibleSuggestions.length].id)}
                >
                    <div className="flex items-center gap-1">
                        <Lightbulb size={10} className="text-purple-400" />
                        <span className={`text-purple-600 font-medium ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                            +{suggestions.length - visibleSuggestions.length} more suggestion{suggestions.length - visibleSuggestions.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
