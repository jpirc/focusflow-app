import React, { useState, useEffect } from 'react';
import { Brain, X, Loader2, AlertTriangle, Sparkles, Lightbulb, RefreshCw, Check, Edit2, Save } from 'lucide-react';
import { Task, Subtask, AIBreakdownSuggestion } from '../types';
import { Theme } from '@/lib/themes';

interface AIBreakdownModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onApply: (subtasks: Subtask[]) => void;
    theme?: Theme;
}

interface EditableSubtask {
    title: string;
    estimatedMinutes: number;
    selected: boolean;
    isEditing: boolean;
}

export const AIBreakdownModal: React.FC<AIBreakdownModalProps> = ({ task, isOpen, onClose, onApply, theme }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<AIBreakdownSuggestion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFallback, setIsFallback] = useState(false);
    const [editableSubtasks, setEditableSubtasks] = useState<EditableSubtask[]>([]);
    
    // Guided questions state
    const [showQuestions, setShowQuestions] = useState(true);
    const [firstStep, setFirstStep] = useState('');
    const [whatYouNeed, setWhatYouNeed] = useState('');
    const [whereDoingIt, setWhereDoingIt] = useState('');
    const [whatsHard, setWhatsHard] = useState('');

    const generateBreakdown = async () => {
        setIsLoading(true);
        setError(null);
        setIsFallback(false);

        // Build context from guided questions
        const userContext = [
            firstStep && `First step I'm thinking: ${firstStep}`,
            whatYouNeed && `What I need: ${whatYouNeed}`,
            whereDoingIt && `Where: ${whereDoingIt}`,
            whatsHard && `What's hard/blocking: ${whatsHard}`,
        ].filter(Boolean).join('\n');

        try {
            const requestPayload = {
                taskId: task.id,
                taskTitle: task.title,
                taskDescription: task.description || undefined,
                estimatedMinutes: task.estimatedMinutes || 30,
                energyLevel: task.energyLevel || 'medium',
                priority: task.priority || 'medium',
                projectId: task.projectId || undefined,
                timeBlock: task.timeBlock || undefined,
                userContext: userContext || undefined,
            };
            
            console.log('[AIBreakdown] Request payload:', requestPayload);
            
            // Call the AI breakdown API
            const response = await fetch('/api/intelligence/breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[AIBreakdown] API error:', errorData);
                throw new Error(errorData.error || 'Failed to generate breakdown');
            }

            const data = await response.json();
            
            setSuggestion({
                subtasks: data.subtasks || [],
                totalEstimate: data.totalEstimate || task.estimatedMinutes,
                tips: data.tips || [],
            });
            
            // Initialize editable subtasks with all selected by default
            setEditableSubtasks((data.subtasks || []).map((st: any) => ({
                title: st.title,
                estimatedMinutes: st.estimatedMinutes,
                selected: true,
                isEditing: false,
            })));
            
            setIsFallback(data.fallback || false);
            setIsLoading(false);
            setShowQuestions(false); // Hide questions after generation
            
        } catch (err: any) {
            console.error('Breakdown generation error:', err);
            setError(err.message || 'Failed to generate breakdown. Please try again.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setSuggestion(null);
            setEditableSubtasks([]);
            setFirstStep('');
            setWhatYouNeed('');
            setWhereDoingIt('');
            setWhatsHard('');
            setError(null);
            setShowQuestions(true);
        }
    }, [isOpen]);

    const handleApply = () => {
        if (editableSubtasks.length > 0) {
            const selectedSubtasks: Subtask[] = editableSubtasks
                .filter(st => st.selected)
                .map((st, i) => ({
                    id: `ai-${Date.now()}-${i}`,
                    title: st.title,
                    completed: false,
                    estimatedMinutes: st.estimatedMinutes
                }));
            
            if (selectedSubtasks.length === 0) {
                alert('Please select at least one subtask to apply.');
                return;
            }
            
            onApply(selectedSubtasks);
            onClose();
        }
    };

    const toggleSubtask = (index: number) => {
        setEditableSubtasks(prev => prev.map((st, i) => 
            i === index ? { ...st, selected: !st.selected } : st
        ));
    };

    const toggleEdit = (index: number) => {
        setEditableSubtasks(prev => prev.map((st, i) => 
            i === index ? { ...st, isEditing: !st.isEditing } : st
        ));
    };

    const updateSubtask = (index: number, field: 'title' | 'estimatedMinutes', value: string | number) => {
        setEditableSubtasks(prev => prev.map((st, i) => 
            i === index ? { ...st, [field]: value } : st
        ));
    };

    const selectedCount = editableSubtasks.filter(st => st.selected).length;
    const totalSelectedTime = editableSubtasks
        .filter(st => st.selected)
        .reduce((sum, st) => sum + st.estimatedMinutes, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div 
                    className="px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20">
                                <Brain size={16} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">AI Task Breakdown</h2>
                                <p className="text-xs text-white/80 truncate max-w-[200px]">&quot;{task.title}&quot;</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    {isFallback && (
                        <div className="mt-2 text-xs bg-white/10 rounded px-2 py-1 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Using smart fallback (AI temporarily unavailable)
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-3 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 size={32} className="mx-auto animate-spin mb-3" style={{ color: theme?.colors.primaryFrom || '#2563eb' }} />
                            <p className="text-sm text-gray-600 font-medium">Analyzing task...</p>
                            <p className="text-xs text-gray-400 mt-1">Breaking into bite-sized pieces</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
                            <p className="text-sm text-gray-600">{error}</p>
                            <button
                                onClick={generateBreakdown}
                                className="mt-3 px-3 py-1.5 bg-gray-100 text-xs hover:bg-gray-200"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : !suggestion && showQuestions ? (
                        /* Guided questions */
                        <div className="space-y-3">
                            <div className="bg-blue-50 border border-blue-200 p-3">
                                <p className="text-xs text-blue-800 font-medium mb-2 flex items-center gap-1">
                                    <Lightbulb size={12} /> Let&apos;s think through this together (optional)
                                </p>
                                {!task.projectId && (
                                    <p className="text-[10px] text-amber-600 mb-2 italic">
                                        💡 Tip: Assigning this task to a project helps me give better suggestions based on your past work!
                                    </p>
                                )}
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={firstStep}
                                        onChange={(e) => setFirstStep(e.target.value)}
                                        placeholder="What's the very first step?"
                                        className="w-full px-2 py-1.5 text-xs border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={whatYouNeed}
                                        onChange={(e) => setWhatYouNeed(e.target.value)}
                                        placeholder="What do you need before you start?"
                                        className="w-full px-2 py-1.5 text-xs border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={whereDoingIt}
                                        onChange={(e) => setWhereDoingIt(e.target.value)}
                                        placeholder="Where will you do this?"
                                        className="w-full px-2 py-1.5 text-xs border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="text"
                                        value={whatsHard}
                                        onChange={(e) => setWhatsHard(e.target.value)}
                                        placeholder="What's making this hard or what are you stuck on?"
                                        className="w-full px-2 py-1.5 text-xs border border-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setFirstStep('');
                                        setWhatYouNeed('');
                                        setWhereDoingIt('');
                                        setWhatsHard('');
                                        generateBreakdown();
                                    }}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={generateBreakdown}
                                    className="flex-1 px-3 py-2 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 text-sm font-medium"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, ${theme?.colors.primaryFrom || '#2563eb'}, ${theme?.colors.primaryTo || '#0891b2'})`
                                    }}
                                >
                                    <Brain size={14} />
                                    Generate Breakdown
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Suggested subtasks with editing */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Sparkles size={12} style={{ color: theme?.colors.primaryFrom || '#2563eb' }} />
                                    Suggested Subtasks ({selectedCount} selected)
                                </h3>
                                <div className="space-y-1.5">
                                    {editableSubtasks.map((subtask, i) => (
                                        <div
                                            key={i}
                                            className={`p-2 border transition-colors ${
                                                subtask.selected 
                                                    ? 'bg-blue-50 border-blue-200' 
                                                    : 'bg-gray-50 border-gray-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {/* Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    checked={subtask.selected}
                                                    onChange={() => toggleSubtask(i)}
                                                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                
                                                {/* Number badge */}
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${
                                                    subtask.selected 
                                                        ? 'bg-blue-100 text-blue-600' 
                                                        : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {i + 1}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {subtask.isEditing ? (
                                                        <div className="space-y-1.5">
                                                            <input
                                                                type="text"
                                                                value={subtask.title}
                                                                onChange={(e) => updateSubtask(i, 'title', e.target.value)}
                                                                className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                autoFocus
                                                            />
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    value={subtask.estimatedMinutes}
                                                                    onChange={(e) => updateSubtask(i, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                                                                    className="w-16 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                    min="1"
                                                                />
                                                                <span className="text-[10px] text-gray-500">minutes</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-xs text-gray-800">{subtask.title}</p>
                                                            <span className="text-[10px] text-gray-500">{subtask.estimatedMinutes} min</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Edit/Save button */}
                                                <button
                                                    onClick={() => toggleEdit(i)}
                                                    className="p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
                                                    title={subtask.isEditing ? "Save" : "Edit"}
                                                >
                                                    {subtask.isEditing ? (
                                                        <Save size={12} className="text-green-600" />
                                                    ) : (
                                                        <Edit2 size={12} className="text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-1.5 text-right text-[10px] text-gray-500">
                                    Total selected: ~{totalSelectedTime} min
                                </div>
                            </div>

                            {/* Tips */}
                            {suggestion?.tips && suggestion.tips.length > 0 && (
                                <div className="bg-amber-50 p-2 border border-amber-100">
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
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isLoading && suggestion && (
                    <div className="px-3 py-2 border-t bg-gray-50 flex gap-2">
                        <button
                            onClick={() => {
                                setSuggestion(null);
                                setEditableSubtasks([]);
                            }}
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-white flex items-center justify-center gap-1.5"
                        >
                            <RefreshCw size={12} />
                            Start Over
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={selectedCount === 0}
                            className={`flex-1 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium ${
                                selectedCount === 0
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'text-white hover:opacity-90'
                            }`}
                            style={selectedCount === 0 ? undefined : {
                                backgroundImage: `linear-gradient(to right, ${theme?.colors.primaryFrom || '#2563eb'}, ${theme?.colors.primaryTo || '#0891b2'})`
                            }}
                        >
                            <Check size={12} />
                            Apply Selected ({selectedCount})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
