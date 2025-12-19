/**
 * Analytics Page - View productivity insights and patterns
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    TrendingUp, 
    Clock, 
    Target, 
    Calendar,
    Zap,
    Brain,
    CheckCircle2,
    BarChart3,
    Loader2,
    RefreshCw,
    Lightbulb,
    X,
    Check,
} from 'lucide-react';

interface Pattern {
    preferredTimeBlock?: string;
    preferredHours?: number[];
    avgTasksPerDay?: number;
    completionRate?: number;
    estimationAccuracy?: number;
    projectId?: string;
}

interface Insight {
    id: string;
    insightType: string;
    category?: string;
    pattern: Pattern;
    confidence: number;
    sampleSize: number;
}

interface Suggestion {
    id: string;
    type: string;
    title: string;
    description?: string;
    reasoning?: string;
    confidence: number;
    status: string;
}

interface Stats {
    completedToday: number;
    completedThisWeek: number;
    completedThisMonth: number;
    totalEvents: number;
    streak: number;
    timeBlockData: Record<string, number>;
}

interface AnalyticsData {
    insights: Insight[];
    suggestions: Suggestion[];
    stats: Stats;
}

export default function AnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchAnalytics();
        }
    }, [status]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            
            // Fetch insights, suggestions, and stats in parallel
            const [insightsRes, suggestionsRes, statsRes] = await Promise.all([
                fetch('/api/intelligence?type=insights'),
                fetch('/api/intelligence?type=suggestions'),
                fetch('/api/intelligence/stats'),
            ]);

            const insights = await insightsRes.json();
            const suggestions = await suggestionsRes.json();
            const stats = await statsRes.json();

            console.log('Analytics API responses:', { insights, suggestions, stats });

            // API returns data directly, not wrapped in { data: ... }
            setData({
                insights: Array.isArray(insights) ? insights : (insights.data || []),
                suggestions: Array.isArray(suggestions) ? suggestions : (suggestions.data || []),
                stats: stats.completedToday !== undefined ? stats : (stats.data || {
                    completedToday: 0,
                    completedThisWeek: 0,
                    completedThisMonth: 0,
                    totalEvents: 0,
                    streak: 0,
                    timeBlockData: {},
                }),
            });
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        try {
            setAnalyzing(true);
            await fetch('/api/intelligence', { method: 'POST' });
            await fetchAnalytics();
        } catch (err) {
            console.error('Failed to run analysis:', err);
        } finally {
            setAnalyzing(false);
        }
    };

    const respondToSuggestion = async (id: string, accepted: boolean) => {
        try {
            await fetch(`/api/intelligence/suggestions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accepted }),
            });
            // Remove from list
            setData(prev => prev ? {
                ...prev,
                suggestions: prev.suggestions.filter(s => s.id !== id),
            } : null);
        } catch (err) {
            console.error('Failed to respond to suggestion:', err);
        }
    };

    // Stat Card Component
    const StatCard = ({ label, value, icon, color, suffix = '' }: { 
        label: string; 
        value: number; 
        icon: React.ReactNode;
        color: string;
        suffix?: string;
    }) => {
        const bgColors: Record<string, string> = {
            green: 'bg-green-50 border-green-200',
            blue: 'bg-blue-50 border-blue-200',
            purple: 'bg-purple-50 border-purple-200',
            orange: 'bg-orange-50 border-orange-200',
        };
        
        return (
            <div className={`p-4 rounded-xl border ${bgColors[color] || 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <span className="text-sm text-gray-600">{label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {value}{suffix && <span className="ml-1">{suffix}</span>}
                </div>
            </div>
        );
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Brain className="text-purple-600" size={24} />
                                Analytics & Insights
                            </h1>
                            <p className="text-sm text-gray-500">
                                Learn from your productivity patterns
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {analyzing ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {analyzing ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Stats Overview */}
                {data?.stats && (
                    <section className="mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard 
                                label="Today" 
                                value={data.stats.completedToday} 
                                icon={<CheckCircle2 className="text-green-500" size={20} />}
                                color="green"
                            />
                            <StatCard 
                                label="This Week" 
                                value={data.stats.completedThisWeek} 
                                icon={<Calendar className="text-blue-500" size={20} />}
                                color="blue"
                            />
                            <StatCard 
                                label="This Month" 
                                value={data.stats.completedThisMonth} 
                                icon={<TrendingUp className="text-purple-500" size={20} />}
                                color="purple"
                            />
                            <StatCard 
                                label="Day Streak" 
                                value={data.stats.streak} 
                                icon={<Zap className="text-orange-500" size={20} />}
                                color="orange"
                                suffix="🔥"
                            />
                        </div>
                    </section>
                )}

                {/* Time Block Breakdown */}
                {data?.stats?.timeBlockData && Object.values(data.stats.timeBlockData).some(v => v > 0) && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="text-blue-500" size={20} />
                            Completions by Time Block
                        </h2>
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-end gap-4 h-40">
                                {['morning', 'afternoon', 'evening'].map(block => {
                                    const value = data.stats.timeBlockData[block] || 0;
                                    const max = Math.max(...Object.values(data.stats.timeBlockData));
                                    const height = max > 0 ? (value / max) * 100 : 0;
                                    const colors: Record<string, string> = {
                                        morning: 'bg-yellow-400',
                                        afternoon: 'bg-orange-400',
                                        evening: 'bg-purple-400',
                                    };
                                    return (
                                        <div key={block} className="flex-1 flex flex-col items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">{value}</span>
                                            <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                                                <div 
                                                    className={`absolute bottom-0 w-full ${colors[block]} rounded-t-lg transition-all duration-500`}
                                                    style={{ height: `${height}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 capitalize">{block}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Suggestions Section */}
                {data?.suggestions && data.suggestions.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Lightbulb className="text-yellow-500" size={20} />
                            Smart Suggestions
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.suggestions.filter(s => s.status === 'pending').map(suggestion => (
                                <div 
                                    key={suggestion.id}
                                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">
                                                {suggestion.title}
                                            </h3>
                                            {suggestion.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {suggestion.description}
                                                </p>
                                            )}
                                            {suggestion.reasoning && (
                                                <p className="text-xs text-purple-600 mt-2">
                                                    💡 {suggestion.reasoning}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => respondToSuggestion(suggestion.id, true)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Accept"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => respondToSuggestion(suggestion.id, false)}
                                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                                title="Dismiss"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                            {suggestion.type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {Math.round(suggestion.confidence * 100)}% confidence
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Insights Grid */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={20} />
                        Your Patterns
                    </h2>
                    
                    {data?.insights && data.insights.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {data.insights.map(insight => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="font-medium text-gray-900 mb-2">
                                No patterns discovered yet
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Complete more tasks to help FocusFlow learn your productivity patterns.
                                We need at least 5 completed tasks to start finding patterns.
                            </p>
                            <button
                                onClick={runAnalysis}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                                Run analysis now →
                            </button>
                        </div>
                    )}
                </section>

                {/* How It Works */}
                <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        How FocusFlow Learns
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600 font-bold text-sm">1</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Track Actions</h3>
                                <p className="text-sm text-gray-600">
                                    Every task you create, complete, or move is recorded with context
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600 font-bold text-sm">2</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Find Patterns</h3>
                                <p className="text-sm text-gray-600">
                                    We analyze your behavior to discover when and how you work best
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600 font-bold text-sm">3</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">Smart Suggestions</h3>
                                <p className="text-sm text-gray-600">
                                    Get personalized recommendations based on your unique patterns
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

// Insight Card Component
function InsightCard({ insight }: { insight: Insight }) {
    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'time_preference': return <Clock className="text-blue-500" size={20} />;
            case 'productivity_window': return <Zap className="text-yellow-500" size={20} />;
            case 'project_timing': return <Target className="text-green-500" size={20} />;
            case 'completion_velocity': return <TrendingUp className="text-purple-500" size={20} />;
            case 'estimation_accuracy': return <BarChart3 className="text-orange-500" size={20} />;
            default: return <Brain className="text-gray-500" size={20} />;
        }
    };

    const getInsightTitle = (type: string) => {
        switch (type) {
            case 'time_preference': return 'Best Time Block';
            case 'productivity_window': return 'Peak Hours';
            case 'project_timing': return 'Project Timing';
            case 'completion_velocity': return 'Task Velocity';
            case 'estimation_accuracy': return 'Time Estimates';
            default: return type.replace(/_/g, ' ');
        }
    };

    const getInsightDescription = (insight: Insight): string => {
        const { pattern, insightType } = insight;
        
        switch (insightType) {
            case 'time_preference':
                return `You complete most tasks in the ${pattern.preferredTimeBlock}`;
            case 'productivity_window':
                if (pattern.preferredHours?.length) {
                    const hours = pattern.preferredHours.map(h => 
                        h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
                    );
                    return `Your peak hours are ${hours.slice(0, 3).join(', ')}`;
                }
                return 'Peak hours detected';
            case 'completion_velocity':
                return `You complete ~${pattern.avgTasksPerDay?.toFixed(1)} tasks per day`;
            case 'estimation_accuracy':
                if (pattern.estimationAccuracy) {
                    if (pattern.estimationAccuracy > 1.2) {
                        return `You underestimate time by ${Math.round((pattern.estimationAccuracy - 1) * 100)}%`;
                    } else if (pattern.estimationAccuracy < 0.8) {
                        return `You overestimate time by ${Math.round((1 - pattern.estimationAccuracy) * 100)}%`;
                    }
                    return 'Your time estimates are accurate';
                }
                return 'Tracking estimation accuracy';
            case 'project_timing':
                return `Best time: ${pattern.preferredTimeBlock}`;
            default:
                return JSON.stringify(pattern);
        }
    };

    const confidenceColor = insight.confidence > 0.7 
        ? 'bg-green-100 text-green-700'
        : insight.confidence > 0.5 
            ? 'bg-yellow-100 text-yellow-700' 
            : 'bg-gray-100 text-gray-600';

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                    {getInsightIcon(insight.insightType)}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                        {getInsightTitle(insight.insightType)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {getInsightDescription(insight)}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceColor}`}>
                            {Math.round(insight.confidence * 100)}% confident
                        </span>
                        <span className="text-xs text-gray-400">
                            {insight.sampleSize} samples
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
