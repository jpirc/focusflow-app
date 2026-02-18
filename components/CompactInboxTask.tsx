/**
 * CompactInboxTask - Minimal task display for sidebar inbox with quick edit
 */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, GripVertical, FileText, Link2, ChevronDown, ChevronRight, Calendar, Clock, Coffee, Briefcase, Home, Check, CheckCircle2, Flag, BatteryLow, BatteryMedium, BatteryFull, RotateCcw } from 'lucide-react';
import { Task, Project, Priority, EnergyLevel, TimeBlock } from '@/types';
import { StartNowButton } from './ui/StartNowButton';
import { formatDate, parseLocalDate } from '@/lib/utils/date';

const iconMap: Record<string, string> = {
    coffee: '☕', briefcase: '💼', home: '🏠', heart: '❤️', 
    dumbbell: '💪', book: '📚', target: '🎯', rocket: '🚀',
    // Add more as needed
};

const projectIconMap: Record<string, string> = {
    briefcase: '💼', laptop: '💻', chart: '📊', calendar: '📅', clipboard: '📋',
    phone: '📱', email: '📧', rocket: '🚀', book: '📚', graduation: '🎓',
    lightbulb: '💡', pencil: '✏️', notebook: '📓', microscope: '🔬',
    heart: '❤️', dumbbell: '💪', apple: '🍎', yoga: '🧘', running: '🏃',
    bicycle: '🚴', home: '🏠', family: '👨‍👩‍👧‍👦', baby: '👶', pet: '🐕',
    plant: '🌱', cooking: '🍳', art: '🎨', music: '🎵', camera: '📷',
    game: '🎮', guitar: '🎸', movie: '🎬', money: '💰', bank: '🏦',
    'chart-up': '📈', piggy: '🐷', 'credit-card': '💳', target: '🎯',
    trophy: '🏆', star: '⭐', fire: '🔥', gem: '💎', crown: '👑',
    plane: '✈️', world: '🌍', beach: '🏖️', mountain: '⛰️', camping: '🏕️',
    folder: '📁', coffee: '☕', pizza: '🍕', gift: '🎁', balloon: '🎈',
    sunny: '☀️', moon: '🌙', rainbow: '🌈',
};

interface CompactInboxTaskProps {
    task: Task;
    project?: Project;
    allProjects: Project[];
    isSelected?: boolean;
    onSelect: (id: string) => void;
    onStartDrag: (item: any) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStartNow: (taskId: string) => Promise<void>;
    onQuickCloseTask: (taskId: string) => void;
}

function CompactInboxTaskComponent({
    task,
    project,
    allProjects,
    isSelected = false,
    onSelect,
    onStartDrag,
    onEdit,
    onDelete,
    onUpdate,
    onStartNow,
    onQuickCloseTask,
}: CompactInboxTaskProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showEnergyDropdown, setShowEnergyDropdown] = useState(false);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [showTimeBlockDropdown, setShowTimeBlockDropdown] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const priorityRef = useRef<HTMLDivElement>(null);
    const energyRef = useRef<HTMLDivElement>(null);
    const projectRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLDivElement>(null);
    const timeBlockRef = useRef<HTMLDivElement>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
                setShowPriorityDropdown(false);
            }
            if (energyRef.current && !energyRef.current.contains(e.target as Node)) {
                setShowEnergyDropdown(false);
            }
            if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
                setShowProjectDropdown(false);
            }
            if (timeRef.current && !timeRef.current.contains(e.target as Node)) {
                setShowTimeDropdown(false);
            }
            if (timeBlockRef.current && !timeBlockRef.current.contains(e.target as Node)) {
                setShowTimeBlockDropdown(false);
            }
            if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.setData('taskId', task.id); // For TimelinePanel compatibility
        onStartDrag({ type: 'task', id: task.id, task });
    };

    const priorityColor = {
        low: 'text-slate-400',
        medium: 'text-blue-500',
        high: 'text-orange-500',
        urgent: 'text-red-500',
    }[task.priority];

    const energyColors = {
        low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
        high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    };

    const hasDescription = !!task.description;
    const hasDependencies = task.dependencies && task.dependencies.length > 0;

    // Priority config
    const priorityStyles = {
        low: { color: '#9CA3AF', label: 'Low' },
        medium: { color: '#3B82F6', label: 'Medium' },
        high: { color: '#F97316', label: 'High' },
        urgent: { color: '#EF4444', label: 'Urgent' },
    };

    // Time block config
    const timeBlocks = [
        { value: 'morning' as TimeBlock, label: 'Morning', icon: <Coffee size={12} />, color: 'text-amber-500' },
        { value: 'afternoon' as TimeBlock, label: 'Afternoon', icon: <Briefcase size={12} />, color: 'text-blue-500' },
        { value: 'evening' as TimeBlock, label: 'Evening', icon: <Home size={12} />, color: 'text-indigo-500' },
    ];

    // Energy levels
    const energyLevels = [
        { value: 'low' as EnergyLevel, icon: <BatteryLow size={14} />, color: 'text-slate-500', label: 'Low' },
        { value: 'medium' as EnergyLevel, icon: <BatteryMedium size={14} />, color: 'text-amber-500', label: 'Medium' },
        { value: 'high' as EnergyLevel, icon: <BatteryFull size={14} />, color: 'text-green-500', label: 'High' },
    ];

    // Quick date options
    const getQuickDates = () => {
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = formatDate(date);
            const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dates.push({ value: dateStr, label });
        }
        return dates;
    };

    // Time estimate presets
    const timePresets = [15, 30, 45, 60, 90, 120];

    const handleUpdate = (updates: Partial<Task>) => {
        onUpdate(task.id, updates);
    };

    const formatCompactTime = (hour: number, minute = 0) => {
        const displayHour = hour % 12 || 12;
        const suffix = hour >= 12 ? 'p' : 'a';
        return `${displayHour}:${String(minute).padStart(2, '0')}${suffix}`;
    };

    const scheduleChip = useMemo(() => {
        if (!task.date) return null;

        const todayStr = formatDate(new Date());
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow);

        let dateLabel = '';
        if (task.date === todayStr) {
            dateLabel = 'Today';
        } else if (task.date === tomorrowStr) {
            dateLabel = 'Tomorrow';
        } else {
            dateLabel = parseLocalDate(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (task.scheduledHour !== null && task.scheduledHour !== undefined) {
            const timeLabel = formatCompactTime(task.scheduledHour, task.scheduledMinute || 0);
            return {
                label: `${dateLabel} ${timeLabel}`,
                title: `Scheduled for ${task.date} at ${timeLabel}`,
                className: 'bg-blue-100 text-blue-700',
            };
        }

        if (task.timeBlock && task.timeBlock !== 'anytime' && task.timeBlock !== 'inbox') {
            const blockLabel =
                task.timeBlock === 'morning' ? 'Morning' :
                task.timeBlock === 'afternoon' ? 'Afternoon' :
                'Evening';

            return {
                label: `${dateLabel} ${blockLabel}`,
                title: `Planned for ${task.date} in ${blockLabel.toLowerCase()}`,
                className: 'bg-amber-100 text-amber-700',
            };
        }

        return {
            label: `${dateLabel} Anytime`,
            title: `Planned for ${task.date} (anytime)`,
            className: 'bg-violet-100 text-violet-700',
        };
    }, [task.date, task.scheduledHour, task.scheduledMinute, task.timeBlock]);

    return (
        <div className="relative">
            {/* Hover tooltip */}
            {showTooltip && !isExpanded && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 text-white text-xs rounded px-2 py-1.5 shadow-lg max-w-xs whitespace-normal">
                    <div className="font-medium mb-0.5">{task.title}</div>
                    {task.estimatedMinutes && (
                        <div className="text-gray-300">⏱️ {task.estimatedMinutes} min</div>
                    )}
                    <div className="text-gray-300">
                        🗓️ {scheduleChip ? scheduleChip.title : 'Not scheduled yet'}
                    </div>
                    {(task.rolloverCount || 0) > 0 && (
                        <div className="text-amber-300">↻ Rolled {task.rolloverCount}x</div>
                    )}
                    {project && (
                        <div className="text-gray-300">📁 {project.name}</div>
                    )}
                </div>
            )}

            <div
                draggable
                onDragStart={handleDragStart}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
                    group flex items-center gap-1.5 px-2 py-1.5 rounded
                    hover:bg-gray-50 cursor-pointer transition-colors
                    ${isSelected ? 'bg-purple-50 ring-1 ring-purple-200' : ''}
                    ${isExpanded ? 'bg-gray-50' : ''}
                `}
            >
                {/* Expand/collapse indicator */}
                <div className="flex-shrink-0 text-gray-400">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>

                {/* Drag handle */}
                <button
                    className="opacity-0 group-hover:opacity-40 hover:opacity-100 text-gray-400 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <GripVertical size={12} />
                </button>

                {/* Play button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(task.id);
                    }}
                    className="flex-shrink-0 p-0.5 text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded transition-colors"
                    title="Start task"
                >
                    <Play size={11} />
                </button>

                {/* Quick close button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onQuickCloseTask(task.id);
                    }}
                    className="flex-shrink-0 p-0.5 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Mark done"
                >
                    <CheckCircle2 size={11} />
                </button>

                {/* Project color dot */}
                {project && (
                    <div 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: project.color }}
                    />
                )}

                {/* Task title with visual cues */}
                <span className="flex-1 text-xs text-gray-700 truncate min-w-0 font-medium flex items-center gap-1">
                    {task.title}
                    {hasDescription && (
                        <FileText size={10} className="text-gray-400 flex-shrink-0" />
                    )}
                    {hasDependencies && (
                        <Link2 size={10} className="text-gray-400 flex-shrink-0" />
                    )}
                </span>

                {/* Schedule state chip (only for scheduled tasks) */}
                {scheduleChip && (
                    <span
                        className={`flex-shrink-0 max-w-[110px] truncate px-1.5 py-0.5 rounded text-[9px] font-medium ${scheduleChip.className}`}
                        title={scheduleChip.title}
                    >
                        {scheduleChip.label}
                    </span>
                )}

                {/* Rollover indicator */}
                {(task.rolloverCount || 0) > 0 && (
                    <span
                        className="flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-700"
                        title={`Rolled over ${task.rolloverCount} time${task.rolloverCount === 1 ? '' : 's'}`}
                    >
                        <RotateCcw size={9} />
                        {task.rolloverCount}
                    </span>
                )}

                {/* Time estimate */}
                {task.estimatedMinutes && (
                    <span className="flex-shrink-0 text-[10px] text-gray-500">
                        {task.estimatedMinutes}m
                    </span>
                )}

                {/* Priority indicator */}
                {(task.priority === 'high' || task.priority === 'urgent') && (
                    <span className={`flex-shrink-0 text-xs ${priorityColor}`}>
                        •
                    </span>
                )}
            </div>

            {/* Expanded details */}
            {isExpanded && (
                <div className="px-2 pb-2 pt-1 bg-gray-50 rounded-b border-l-2 border-gray-200 ml-6 space-y-2">
                    {/* Description */}
                    {task.description && (
                        <div className="text-[11px] text-gray-600 leading-relaxed">
                            {task.description}
                        </div>
                    )}

                    {/* Quick Edit Controls */}
                    <div className="space-y-1.5">
                        {/* Row 1: Priority & Energy */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wide w-12">Level</span>
                            
                            {/* Priority Badge */}
                            <div className="relative" ref={priorityRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPriorityDropdown(!showPriorityDropdown);
                                    }}
                                    className="w-3 h-3 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all flex items-center justify-center"
                                    style={{ backgroundColor: priorityStyles[task.priority].color }}
                                    title={`${priorityStyles[task.priority].label} priority (click to change)`}
                                >
                                    {task.priority === 'urgent' && <Flag size={7} className="text-white" />}
                                </button>
                                
                                {showPriorityDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[100px]">
                                        {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                                            <button
                                                key={p}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdate({ priority: p });
                                                    setShowPriorityDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center" style={{ backgroundColor: priorityStyles[p].color }}>
                                                    {p === 'urgent' && <Flag size={6} className="text-white" />}
                                                </div>
                                                {priorityStyles[p].label}
                                                {p === task.priority && <Check size={10} className="ml-auto text-gray-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Energy Badge */}
                            <div className="relative" ref={energyRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEnergyDropdown(!showEnergyDropdown);
                                    }}
                                    className={`${energyLevels.find(l => l.value === task.energyLevel)?.color} cursor-pointer hover:opacity-70 transition-opacity`}
                                    title="Click to change energy level"
                                >
                                    {energyLevels.find(l => l.value === task.energyLevel)?.icon}
                                </button>
                                
                                {showEnergyDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[100px]">
                                        {energyLevels.map((lvl) => (
                                            <button
                                                key={lvl.value}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdate({ energyLevel: lvl.value });
                                                    setShowEnergyDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <span className={lvl.color}>{lvl.icon}</span>
                                                {lvl.label}
                                                {lvl.value === task.energyLevel && <Check size={10} className="ml-auto text-gray-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Time Estimate */}
                            <div className="relative ml-auto" ref={timeRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTimeDropdown(!showTimeDropdown);
                                    }}
                                    className="flex items-center gap-0.5 text-gray-500 text-xs cursor-pointer hover:text-gray-700 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors"
                                    title="Click to set time estimate"
                                >
                                    <Clock size={11} />
                                    <span className="font-medium">{task.estimatedMinutes || '?'}</span>
                                </button>
                                
                                {showTimeDropdown && (
                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[100px]">
                                        {timePresets.map((minutes) => (
                                            <button
                                                key={minutes}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdate({ estimatedMinutes: minutes });
                                                    setShowTimeDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center justify-between"
                                            >
                                                {minutes}m
                                                {minutes === task.estimatedMinutes && <Check size={10} className="text-gray-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Project */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wide w-12">Project</span>
                            
                            <div className="relative" ref={projectRef}>
                                {project && project.id !== 'default' ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowProjectDropdown(!showProjectDropdown);
                                        }}
                                        className="w-5 h-5 rounded flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all"
                                        style={{ backgroundColor: project.color }}
                                        title={`${project.name} (click to change)`}
                                    >
                                        {projectIconMap[project.icon] || '📁'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowProjectDropdown(!showProjectDropdown);
                                        }}
                                        className="w-5 h-5 rounded border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all text-[10px]"
                                        title="Click to assign project"
                                    >
                                        +
                                    </button>
                                )}
                                
                                {showProjectDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 max-h-48 overflow-y-auto min-w-[140px]">
                                        {allProjects.map((proj) => (
                                            <button
                                                key={proj.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdate({ projectId: proj.id });
                                                    setShowProjectDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px]" style={{ backgroundColor: proj.color }}>
                                                    {projectIconMap[proj.icon] || '📁'}
                                                </div>
                                                <span className="flex-1 truncate">{proj.name}</span>
                                                {proj.id === task.projectId && <Check size={10} className="text-gray-600 flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {project && project.id !== 'default' && (
                                <span className="text-[10px] text-gray-600 truncate flex-1">{project.name}</span>
                            )}
                        </div>

                        {/* Row 3: Schedule */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wide w-12">Schedule</span>
                            
                            {/* Date Picker */}
                            <div className="relative" ref={datePickerRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDatePicker(!showDatePicker);
                                    }}
                                    className="flex items-center gap-1 text-gray-600 text-[10px] cursor-pointer hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors"
                                    title="Click to schedule"
                                >
                                    <Calendar size={11} />
                                    <span>Pick date</span>
                                </button>
                                
                                {showDatePicker && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[130px]">
                                        {getQuickDates().map(({ value, label }) => (
                                            <button
                                                key={value}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdate({ date: value, timeBlock: 'morning' });
                                                    setShowDatePicker(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Time Block Picker */}
                            <div className="relative" ref={timeBlockRef}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTimeBlockDropdown(!showTimeBlockDropdown);
                                    }}
                                    className="flex items-center gap-1 text-gray-600 text-[10px] cursor-pointer hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors"
                                    title="Click to pick time block"
                                >
                                    <Clock size={11} />
                                    <span>Pick time</span>
                                </button>
                                
                                {showTimeBlockDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[120px]">
                                        {timeBlocks.map((block) => (
                                            <button
                                                key={block.value}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const today = formatDate(new Date());
                                                    handleUpdate({ timeBlock: block.value, date: today });
                                                    setShowTimeBlockDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                {block.icon}
                                                {block.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                        {/* Start Now button - primary action */}
                        <StartNowButton
                            onStartNow={() => onStartNow(task.id)}
                            size="xs"
                            showLabel={true}
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuickCloseTask(task.id);
                            }}
                            className="text-[10px] text-green-600 hover:text-green-700 font-medium"
                        >
                            Quick close
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(task);
                            }}
                            className="text-[10px] text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Advanced edit →
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${task.title}"?`)) {
                                    onDelete(task.id);
                                }
                            }}
                            className="text-[10px] text-red-600 hover:text-red-700 font-medium ml-auto"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Memoize to prevent re-renders
export const CompactInboxTask = React.memo(
    CompactInboxTaskComponent,
    (prevProps, nextProps) => {
        return (
            prevProps.task === nextProps.task &&
            prevProps.project?.id === nextProps.project?.id &&
            prevProps.isSelected === nextProps.isSelected
        );
    }
);
