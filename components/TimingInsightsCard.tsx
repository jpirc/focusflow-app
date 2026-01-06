/**
 * Task Timing Insights - Shows estimation accuracy and patterns
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, TrendingDown, Target, Zap, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface TimingInsights {
    hasData: boolean;
    message?: string;
    summary?: {
        totalTasks: number;
        accuracyRate: number;
        avgEstimated: number;
        avgActual: number;
        avgDifference: number;
        avgPercentageOff: number;
        tendency: 'underestimate' | 'overestimate' | 'accurate';
    };
    breakdown?: {
        overestimated: number;
        underestimated: number;
        onTime: number;
    };
    patterns?: {
        byPriority: Array<{
            priority: string;
            count: number;
            avgPercentageOff: number;
            tendency: string;
        }>;
        byEnergy: Array<{
            energyLevel: string;
            count: number;
            avgPercentageOff: number;
            tendency: string;
        }>;
    };
    recentTrend?: {
        last7Days: number;
        overall: number;
        change: number;
    } | null;
    insights: string[];
    recentTasks?: Array<{
        title: string;
        estimated: number;
        actual: number;
        difference: number;
        percentageOff: number;
    }>;
}

export function TimingInsightsCard() {
    const [insights, setInsights] = useState<TimingInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/intelligence/timing');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setInsights(data);
        } catch (err) {
            setError('Failed to load timing insights');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !insights) {
        return null; // Silently fail - not critical
    }

    if (!insights.hasData) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Clock size={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-purple-900 mb-1">⏱️ Timing Insights</h3>
                        <p className="text-xs text-purple-700">{insights.message}</p>
                        <p className="text-xs text-purple-600 mt-2">Add time estimates to tasks and track how long they actually take!</p>
                    </div>
                </div>
            </div>
        );
    }

    const { summary, breakdown, patterns, recentTrend } = insights;

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    summary!.tendency === 'accurate' 
                        ? 'bg-green-100' 
                        : summary!.tendency === 'underestimate'
                        ? 'bg-amber-100'
                        : 'bg-blue-100'
                }`}>
                    <Target size={20} className={
                        summary!.tendency === 'accurate' 
                            ? 'text-green-600' 
                            : summary!.tendency === 'underestimate'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                    } />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">⏱️ Timing Insights</h3>
                        <span className="text-xs text-gray-500">{summary!.totalTasks} tasks</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                        {summary!.accuracyRate}% accurate • {
                            summary!.tendency === 'accurate' 
                                ? 'On track' 
                                : summary!.tendency === 'underestimate'
                                ? `${Math.abs(summary!.avgPercentageOff)}% under`
                                : `${Math.abs(summary!.avgPercentageOff)}% over`
                        }
                    </p>
                    {/* Key insight preview */}
                    <p className="text-xs text-gray-700 italic">"{insights.insights[0]}"</p>
                </div>
                <div className="flex-shrink-0">
                    {isExpanded ? <X size={16} /> : <TrendingUp size={16} />}
                </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Avg Estimate</div>
                            <div className="text-sm font-semibold text-gray-900">{summary!.avgEstimated}m</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Avg Actual</div>
                            <div className="text-sm font-semibold text-gray-900">{summary!.avgActual}m</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Difference</div>
                            <div className={`text-sm font-semibold ${
                                summary!.avgDifference > 0 ? 'text-amber-600' : summary!.avgDifference < 0 ? 'text-blue-600' : 'text-green-600'
                            }`}>
                                {summary!.avgDifference > 0 ? '+' : ''}{summary!.avgDifference}m
                            </div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    {breakdown && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">Estimation Distribution</div>
                            <div className="flex gap-1 h-6 rounded-full overflow-hidden">
                                {breakdown.underestimated > 0 && (
                                    <div 
                                        className="bg-amber-400 flex items-center justify-center text-[10px] text-white font-medium"
                                        style={{ width: `${(breakdown.underestimated / summary!.totalTasks) * 100}%` }}
                                        title={`${breakdown.underestimated} underestimated`}
                                    >
                                        {breakdown.underestimated > 2 && breakdown.underestimated}
                                    </div>
                                )}
                                {breakdown.onTime > 0 && (
                                    <div 
                                        className="bg-green-500 flex items-center justify-center text-[10px] text-white font-medium"
                                        style={{ width: `${(breakdown.onTime / summary!.totalTasks) * 100}%` }}
                                        title={`${breakdown.onTime} on time`}
                                    >
                                        {breakdown.onTime > 2 && breakdown.onTime}
                                    </div>
                                )}
                                {breakdown.overestimated > 0 && (
                                    <div 
                                        className="bg-blue-400 flex items-center justify-center text-[10px] text-white font-medium"
                                        style={{ width: `${(breakdown.overestimated / summary!.totalTasks) * 100}%` }}
                                        title={`${breakdown.overestimated} overestimated`}
                                    >
                                        {breakdown.overestimated > 2 && breakdown.overestimated}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                    Under ({breakdown.underestimated})
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    On Time ({breakdown.onTime})
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    Over ({breakdown.overestimated})
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Recent trend */}
                    {recentTrend && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-gray-700">Recent Trend (7 days)</div>
                                {recentTrend.change !== 0 && (
                                    <div className={`flex items-center gap-0.5 text-xs font-medium ${
                                        recentTrend.change > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {recentTrend.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {Math.abs(recentTrend.change)}%
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-600">
                                {recentTrend.last7Days}% accurate recently vs {recentTrend.overall}% overall
                            </div>
                        </div>
                    )}

                    {/* All insights */}
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-1 mb-2">
                            <Zap size={14} className="text-purple-600" />
                            <div className="text-xs font-medium text-purple-900">Insights</div>
                        </div>
                        <div className="space-y-1.5">
                            {insights.insights.map((insight, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-purple-800">
                                    <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                                    <span>{insight}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent tasks */}
                    {insights.recentTasks && insights.recentTasks.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">Recent Completions</div>
                            <div className="space-y-1.5">
                                {insights.recentTasks.map((task, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-700 truncate flex-1 mr-2">{task.title}</span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-gray-500">{task.estimated}m</span>
                                            <span className="text-gray-400">→</span>
                                            <span className={`font-medium ${
                                                Math.abs(task.percentageOff) <= 20 
                                                    ? 'text-green-600' 
                                                    : task.difference > 0 
                                                    ? 'text-amber-600' 
                                                    : 'text-blue-600'
                                            }`}>
                                                {task.actual}m
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
