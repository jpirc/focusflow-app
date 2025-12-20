import React, { useState, useEffect } from 'react';
import { Brain, X, Loader2, AlertTriangle, Sparkles, Lightbulb, RefreshCw, Check } from 'lucide-react';
import { Task, Subtask, AIBreakdownSuggestion } from '../types';

interface AIBreakdownModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onApply: (subtasks: Subtask[]) => void;
}

export const AIBreakdownModal: React.FC<AIBreakdownModalProps> = ({ task, isOpen, onClose, onApply }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<AIBreakdownSuggestion | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateBreakdown = async () => {
        setIsLoading(true);
        setError(null);

        // Simulated AI response - in production this would call Claude API
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate contextual breakdown based on task title
        const breakdowns: Record<string, AIBreakdownSuggestion> = {
            default: {
                subtasks: [
                    { title: 'Gather materials and context needed', estimatedMinutes: 10 },
                    { title: 'Create initial outline or draft', estimatedMinutes: 15 },
                    { title: 'Work on main content/task', estimatedMinutes: Math.max(15, task.estimatedMinutes - 40) },
                    { title: 'Review and refine', estimatedMinutes: 10 },
                    { title: 'Final check and wrap up', estimatedMinutes: 5 },
                ],
                totalEstimate: task.estimatedMinutes,
                tips: [
                    'Start with the easiest subtask to build momentum',
                    'Take a 5-minute break between subtasks if needed',
                    'Check off each subtask as you complete it for dopamine boost'
                ]
            }
        };

        // Customize based on task keywords
        if (task.title.toLowerCase().includes('document') || task.title.toLowerCase().includes('report')) {
            setSuggestion({
                subtasks: [
                    { title: 'Review requirements and gather source materials', estimatedMinutes: 15 },
                    { title: 'Create document outline with main sections', estimatedMinutes: 10 },
                    { title: 'Write first draft of key sections', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.4) },
                    { title: 'Add supporting details and examples', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.2) },
                    { title: 'Review, edit, and format', estimatedMinutes: 15 },
                    { title: 'Get feedback or final approval', estimatedMinutes: 10 },
                ],
                totalEstimate: task.estimatedMinutes,
                tips: [
                    'Don\'t aim for perfection on the first draft',
                    'Use bullet points first, then convert to prose',
                    'Set a timer for each section to maintain momentum'
                ]
            });
        } else if (task.title.toLowerCase().includes('meeting') || task.title.toLowerCase().includes('present')) {
            setSuggestion({
                subtasks: [
                    { title: 'Review meeting agenda and objectives', estimatedMinutes: 5 },
                    { title: 'Prepare talking points or slides', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.3) },
                    { title: 'Anticipate questions and prepare answers', estimatedMinutes: 10 },
                    { title: 'Do a quick practice run-through', estimatedMinutes: 10 },
                    { title: 'Attend meeting and present', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.4) },
                    { title: 'Document action items and follow-ups', estimatedMinutes: 5 },
                ],
                totalEstimate: task.estimatedMinutes,
                tips: [
                    'Arrive 5 minutes early to settle in',
                    'Have your materials open and ready beforehand',
                    'It\'s okay to say "I\'ll follow up on that"'
                ]
            });
        } else if (task.title.toLowerCase().includes('email') || task.title.toLowerCase().includes('write')) {
            setSuggestion({
                subtasks: [
                    { title: 'Identify the main purpose and recipient needs', estimatedMinutes: 3 },
                    { title: 'Draft the key message in bullet points', estimatedMinutes: 5 },
                    { title: 'Expand bullets into full sentences', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.4) },
                    { title: 'Add opening and closing', estimatedMinutes: 5 },
                    { title: 'Proofread and send', estimatedMinutes: 5 },
                ],
                totalEstimate: task.estimatedMinutes,
                tips: [
                    'Start with the action you want the reader to take',
                    'Keep paragraphs short (2-3 sentences max)',
                    'Read it aloud before sending'
                ]
            });
        } else if (task.title.toLowerCase().includes('research') || task.title.toLowerCase().includes('learn')) {
            setSuggestion({
                subtasks: [
                    { title: 'Define what you want to learn/find out', estimatedMinutes: 5 },
                    { title: 'Identify 3-5 good sources', estimatedMinutes: 10 },
                    { title: 'Read/review sources and take notes', estimatedMinutes: Math.floor(task.estimatedMinutes * 0.5) },
                    { title: 'Synthesize key findings', estimatedMinutes: 10 },
                    { title: 'Document conclusions or next steps', estimatedMinutes: 5 },
                ],
                totalEstimate: task.estimatedMinutes,
                tips: [
                    'Set a time limit to avoid rabbit holes',
                    'Use the Pomodoro technique (25 min focus, 5 min break)',
                    'Write summaries in your own words to retain information'
                ]
            });
        } else {
            setSuggestion(breakdowns.default);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen && !suggestion) {
            generateBreakdown();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleApply = () => {
        if (suggestion) {
            const newSubtasks: Subtask[] = suggestion.subtasks.map((st, i) => ({
                id: `ai-${Date.now()}-${i}`,
                title: st.title,
                completed: false,
                estimatedMinutes: st.estimatedMinutes
            }));
            onApply(newSubtasks);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-3 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Brain size={16} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">AI Task Breakdown</h2>
                                <p className="text-xs text-white/80 truncate max-w-[200px]">"{task.title}"</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-3 max-h-[50vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 size={32} className="mx-auto text-purple-500 animate-spin mb-3" />
                            <p className="text-sm text-gray-600 font-medium">Analyzing task...</p>
                            <p className="text-xs text-gray-400 mt-1">Breaking into bite-sized pieces</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
                            <p className="text-sm text-gray-600">{error}</p>
                            <button
                                onClick={generateBreakdown}
                                className="mt-3 px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : suggestion ? (
                        <div className="space-y-3">
                            {/* Suggested subtasks */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-purple-500" />
                                    Suggested Subtasks
                                </h3>
                                <div className="space-y-1">
                                    {suggestion.subtasks.map((subtask, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-800 truncate">{subtask.title}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded flex-shrink-0">
                                                {subtask.estimatedMinutes}m
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-1.5 text-right text-[10px] text-gray-500">
                                    Total: ~{suggestion.subtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0)} min
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                                <h4 className="text-[10px] font-medium text-amber-800 flex items-center gap-1 mb-1">
                                    <Lightbulb size={10} />
                                    Tips
                                </h4>
                                <ul className="space-y-0.5">
                                    {suggestion.tips.map((tip, i) => (
                                        <li key={i} className="text-[10px] text-amber-700 flex items-start gap-1">
                                            <span className="text-amber-400">•</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                {!isLoading && suggestion && (
                    <div className="px-3 py-2 border-t bg-gray-50 flex gap-2">
                        <button
                            onClick={generateBreakdown}
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-white flex items-center justify-center gap-1.5"
                        >
                            <RefreshCw size={12} />
                            Regenerate
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5 text-xs font-medium"
                        >
                            <Check size={12} />
                            Apply
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
