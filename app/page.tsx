/**
 * FocusFlow - Main Application Page
 * 
 * This page composes the app from hooks and components.
 * All business logic lives in hooks, all UI in components.
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Brain, CheckCircle2, RotateCcw, Pencil, Trash2 } from 'lucide-react';

// Hooks
import { useTasks, useProjects, useCelebration } from '@/hooks';

// Components
import { Sidebar, Header } from '@/components/layout';
import { QuickEditTaskCard } from '@/components/QuickEditTaskCard';
import { TimeBlockColumn } from '@/components/TimeBlockColumn';
import { UpcomingDayColumn } from '@/components/UpcomingDayColumn';
import { CalendarView } from '@/components/CalendarView';
import { AIBreakdownModal } from '@/components/AIBreakdownModal';
import { EditTaskModal } from '@/components/EditTaskModal';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { SmartCaptureModal } from '@/components/SmartCaptureModal';
import { CelebrationMessage } from '@/components/CelebrationMessage';
import { DailyPrioritiesModal } from '@/components/DailyPrioritiesModal';
import { Top3Section } from '@/components/Top3Section';
import { RolloverNotification } from '@/components/RolloverNotification';
import { UnblockedTasksNotification } from '@/components/UnblockedTasksNotification';

// Utilities & Constants
import { formatDate, formatDisplayDate, addDays, isToday, getWeekStart, isWeekend } from '@/lib/utils/date';
import { TIME_BLOCKS } from '@/lib/constants';

// Types
import { Task, Subtask, TimeBlock, DragItem, TaskStatus, Project } from '@/types';

// ============================================
// Main Component
// ============================================

export default function FocusFlowApp() {
    const { data: session } = useSession();
    const isAuthenticated = !!session?.user?.id;

    // ============================================
    // Custom Hooks for State Management
    // ============================================
    // Hooks
    // ============================================

    // Celebration system for task completion (must be before useTasks)
    const {
        celebrate,
        message: celebrationMessage,
        todayStreak,
        incrementStreak,
    } = useCelebration({
        enabled: true,
        soundEnabled: false, // Can be made configurable via settings
        intensity: 'normal',
    });

    const {
        tasks,
        setTasks,
        loading,
        rolledOverTasks,
        dismissRolloverNotification,
        unblockedTasks,
        dismissUnblockedNotification,
        createTask,
        updateTask,
        deleteTask,
        updateStatus,
        pauseTask,
        moveTask,
        addSubtask,
        toggleSubtask,
        updateSubtask,
        deleteSubtask,
        addDependency,
        removeDependency,
        setTopPriorities,
        applyAIBreakdown,
        refreshTasks,
    } = useTasks({ 
        isAuthenticated,
        onTaskComplete: () => {
            celebrate();
            incrementStreak();
        }
    });

    const {
        projects,
        selectedProjectId,
        selectProject,
        createProject,
        updateProject,
        deleteProject,
        getProjectById,
    } = useProjects({ isAuthenticated });

    // ============================================
    // Local UI State
    // ============================================

    // Normalize to local midnight to avoid timezone drift
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });
    const [viewDays, setViewDays] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('defaultViewDays');
            return saved ? parseInt(saved, 10) : 2;
        }
        return 2;
    });
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [taskToEditId, setTaskToEditId] = useState<string | null>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [taskForAI, setTaskForAI] = useState<Task | null>(null);
    const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [smartCaptureModalOpen, setSmartCaptureModalOpen] = useState(false);
    const [dailyPrioritiesModalOpen, setDailyPrioritiesModalOpen] = useState(false);
    const [subtasksExpandedAll, setSubtasksExpandedAll] = useState(true);

    // Derive the current task to edit from the tasks array (stays in sync with subtask updates)
    const taskToEdit = useMemo(() => 
        taskToEditId ? tasks.find(t => t.id === taskToEditId) || null : null,
        [taskToEditId, tasks]
    );

    // ============================================
    // Computed Values
    // ============================================

    const inboxTasks = useMemo(() =>
        tasks.filter(t =>
            !t.date &&
            t.status !== 'completed' &&
            (!selectedProjectId || t.projectId === selectedProjectId)
        ),
        [tasks, selectedProjectId]
    );

    // Today's date string for Top 3 priorities
    const todayDateStr = useMemo(() => formatDate(new Date()), []);

    // Get existing Top 3 priorities for today
    const todayTopPriorities = useMemo(() =>
        tasks
            .filter(t => t.isTopPriority && t.topPriorityDate === todayDateStr)
            .map(t => t.id),
        [tasks, todayDateStr]
    );

    // Active task (currently in-progress) for header nudge
    const [elapsedTime, setElapsedTime] = useState(0);
    
    const activeTask = useMemo(() => {
        const task = tasks.find(t => t.status === 'in-progress');
        if (!task || !task.startedAt) return null;
        const project = projects.find(p => p.id === task.projectId);
        const currentSubtask = task.subtasks?.find(s => !s.completed);
        return {
            id: task.id,
            title: task.title,
            projectColor: project?.color || '#6b7280',
            elapsedMinutes: elapsedTime,
            startedAt: task.startedAt,
            currentSubtask: currentSubtask?.title,
        };
    }, [tasks, projects, elapsedTime]);

    // Update elapsed time every minute for active task
    useEffect(() => {
        const task = tasks.find(t => t.status === 'in-progress');
        if (task && task.startedAt) {
            const updateElapsed = () => {
                const currentSessionMinutes = Math.floor((Date.now() - new Date(task.startedAt!).getTime()) / 60000);
                const accumulatedMinutes = task.actualMinutes || 0;
                setElapsedTime(currentSessionMinutes + accumulatedMinutes);
            };
            updateElapsed(); // Initial update
            const interval = setInterval(updateElapsed, 60000); // Update every minute
            return () => clearInterval(interval);
        } else {
            setElapsedTime(0);
        }
    }, [tasks]);

    // For week view (7 days), start from Sunday of current week
    const displayDays = useMemo(() => {
        const startDate = viewDays === 7 ? getWeekStart(currentDate) : currentDate;
        
        return Array.from({ length: viewDays }, (_, i) => {
            const date = addDays(startDate, i);
            const dateStr = formatDate(date);
            const dayTasks = tasks.filter(t =>
                formatDate(t.date!) === dateStr &&
                t.status !== 'completed' &&
                (!selectedProjectId || t.projectId === selectedProjectId)
            );
            // Get completed tasks for this day (by completedAt date)
            const completedTasks = tasks.filter(t => {
                if (t.status !== 'completed' || !t.completedAt) return false;
                const completedDate = formatDate(new Date(t.completedAt));
                return completedDate === dateStr && (!selectedProjectId || t.projectId === selectedProjectId);
            });
            return {
                date,
                dateStr,
                display: formatDisplayDate(dateStr),
                isToday: isToday(dateStr),
                isWeekend: isWeekend(date),
                tasks: dayTasks,
                completedTasks,
            };
        });
    }, [currentDate, viewDays, tasks, selectedProjectId]);

    // Sidebar: Always show 5 days starting from today (fixed navigation)
    // This provides consistent quick-nav regardless of what date you're viewing
    const upcomingDays = useMemo(() => {
        // Don't show sidebar for week view (7 days)
        if (viewDays === 7) return [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Always show 5 days starting from today
        return Array.from({ length: 5 }, (_, i) => {
            const date = addDays(today, i);
            const dateStr = formatDate(date);
            return {
                date,
                dateStr,
                dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }),
                isWeekend: isWeekend(date),
                isToday: i === 0,
                taskCount: tasks.filter(t => 
                    formatDate(t.date!) === dateStr && 
                    t.status !== 'completed' &&
                    (!selectedProjectId || t.projectId === selectedProjectId)
                ).length,
            };
        });
    }, [viewDays, tasks, selectedProjectId]);

    // ============================================
    // Keyboard Shortcuts
    // ============================================

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSmartCaptureModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ============================================
    // Redirect if not authenticated
    // ============================================

    useEffect(() => {
        if (!loading && !session) {
            window.location.href = '/login';
        }
    }, [session, loading]);

    // ============================================
    // Morning Prompt for Top 3 Priorities
    // ============================================

    useEffect(() => {
        if (loading || !session) return;

        // Check if we should show the morning prompt
        const checkMorningPrompt = () => {
            const now = new Date();
            const hour = now.getHours();

            // Only show between 5 AM and 11 AM
            if (hour < 5 || hour >= 11) return;

            // Check if user has already set Top 3 for today
            if (todayTopPriorities.length > 0) return;

            // Check if user has already dismissed the prompt today
            const dismissedKey = `focusflow_top3_dismissed_${todayDateStr}`;
            if (localStorage.getItem(dismissedKey)) return;

            // Check if there are any tasks to prioritize
            const todayTasks = tasks.filter(t =>
                t.status !== 'completed' &&
                (t.date === todayDateStr || t.date === null)
            );
            if (todayTasks.length === 0) return;

            // Show the modal
            setDailyPrioritiesModalOpen(true);
        };

        // Small delay to let tasks load
        const timer = setTimeout(checkMorningPrompt, 1000);
        return () => clearTimeout(timer);
    }, [loading, session, tasks, todayDateStr, todayTopPriorities.length]);

    // ============================================
    // Handlers
    // ============================================

    const handleEditTask = useCallback((task: Task) => {
        setTaskToEditId(task.id);
        setEditModalOpen(true);
    }, []);

    const handleAIBreakdown = useCallback((task: Task) => {
        setTaskForAI(task);
        setAiModalOpen(true);
    }, []);

    const handleApplyAIBreakdown = useCallback((subtasks: Subtask[]) => {
        if (taskForAI) {
            applyAIBreakdown(taskForAI.id, subtasks);
        }
    }, [taskForAI, applyAIBreakdown]);

    const handleCloseDailyPriorities = useCallback(() => {
        setDailyPrioritiesModalOpen(false);
        // Mark as dismissed for today
        const dismissedKey = `focusflow_top3_dismissed_${todayDateStr}`;
        localStorage.setItem(dismissedKey, 'true');
    }, [todayDateStr]);

    const handleSetTopPriorities = useCallback(async (taskIds: string[]) => {
        await setTopPriorities(taskIds, todayDateStr);
        setDailyPrioritiesModalOpen(false);
    }, [setTopPriorities, todayDateStr]);

    const handleStartDrag = useCallback((item: DragItem) => {
        console.log('Dragging', item);
    }, []);

    // Wrap updateStatus to trigger celebration on completion
    const handleStatusChange = useCallback((taskId: string, status: TaskStatus) => {
        updateStatus(taskId, status);
        if (status === 'completed') {
            const newStreak = incrementStreak();
            celebrate(newStreak);
        }
    }, [updateStatus, incrementStreak, celebrate]);

    const handleDrop = useCallback(async (taskId: string, targetDate: string, targetBlock: TimeBlock, insertBeforeTaskId?: string) => {
        console.log('[DRAG] handleDrop called:', { taskId, targetDate, targetBlock, insertBeforeTaskId });
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.log('[DRAG] Task not found:', taskId);
            return;
        }
        
        const isSameBucket = task.date === targetDate && task.timeBlock === targetBlock;
        console.log('[DRAG] isSameBucket:', isSameBucket, 'insertBeforeTaskId:', insertBeforeTaskId);
        
        if (isSameBucket && insertBeforeTaskId) {
            // Reordering within same bucket
            const bucketTasks = tasks
                .filter(t => t.date === targetDate && t.timeBlock === targetBlock)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
            
            console.log('[DRAG] Bucket tasks:', bucketTasks.map(t => ({ id: t.id, title: t.title, order: t.order })));
            const currentIndex = bucketTasks.findIndex(t => t.id === taskId);
            const targetIndex = bucketTasks.findIndex(t => t.id === insertBeforeTaskId);
            console.log('[DRAG] Indexes - current:', currentIndex, 'target:', targetIndex);
            
            if (currentIndex !== -1 && targetIndex !== -1 && currentIndex !== targetIndex) {
                console.log('[DRAG] Reordering - moving from', currentIndex, 'to', targetIndex);
                // Reorder tasks
                const reorderedTasks = [...bucketTasks];
                const [moved] = reorderedTasks.splice(currentIndex, 1);
                reorderedTasks.splice(targetIndex > currentIndex ? targetIndex - 1 : targetIndex, 0, moved);
                
                console.log('[DRAG] New order:', reorderedTasks.map(t => ({ id: t.id, title: t.title })));
                
                // OPTIMISTIC UPDATE - reorder array AND update order field
                setTasks(prev => {
                    // Separate tasks: those in the bucket vs others
                    const bucketTaskIds = new Set(reorderedTasks.map(t => t.id));
                    const otherTasks = prev.filter(t => !bucketTaskIds.has(t.id));
                    
                    // Update order field on reordered tasks
                    const updatedBucketTasks = reorderedTasks.map((task, i) => ({
                        ...prev.find(t => t.id === task.id)!,
                        order: i
                    }));
                    
                    // Combine: others + reordered bucket tasks
                    return [...otherTasks, ...updatedBucketTasks];
                });
                
                // Fire API updates in background (don't await)
                Promise.all(
                    reorderedTasks.map((task, i) => {
                        console.log('[DRAG] Updating task', task.title, 'order to', i);
                        return updateTask(task.id, { order: i });
                    })
                ).catch(err => {
                    console.error('[DRAG] Reorder failed, refreshing:', err);
                    refreshTasks(); // Only refresh on error
                });
            } else {
                console.log('[DRAG] Skipping reorder - conditions not met');
            }
        } else {
            // Moving to different bucket - use existing logic
            await moveTask(taskId, targetDate, targetBlock);
        }
    }, [tasks, moveTask, updateTask, refreshTasks]);

    const handleCreateProject = useCallback(async (name: string, color: string, icon: string) => {
        await createProject({ name, color, icon });
    }, [createProject]);

    const handleUpdateProject = useCallback(async (id: string, updates: { name?: string; color?: string; icon?: string }): Promise<boolean> => {
        return await updateProject(id, updates);
    }, [updateProject]);

    // Update subtasks helper (for TaskCard compatibility)
    const handleUpdateSubtasks = useCallback((taskId: string, subtasks: Subtask[]) => {
        // This is handled by the individual subtask operations now
        console.log('Update subtasks called', taskId, subtasks.length);
    }, []);

    // ============================================
    // Loading State
    // ============================================

    if (loading || !session) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white mx-auto mb-4">
                        <Brain size={24} />
                    </div>
                    <p className="text-gray-600 font-medium">Loading FocusFlow...</p>
                </div>
            </div>
        );
    }

    // ============================================
    // Render
    // ============================================

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                userName={session?.user?.name}
                tasks={tasks}
                inboxTasks={inboxTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onUpdate={updateTask}
                onStatusChange={handleStatusChange}
                onPause={pauseTask}
                onToggleSubtask={toggleSubtask}
                onStartDrag={handleStartDrag}
                onDelete={deleteTask}
                onAIBreakdown={handleAIBreakdown}
                onUpdateSubtasks={handleUpdateSubtasks}
                onEdit={handleEditTask}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={selectProject}
                onCreateProject={() => setCreateProjectModalOpen(true)}
                onUpdateProject={(id, updates) => {
                    const project = projects.find(p => p.id === id);
                    if (project) {
                        setEditingProject({ ...project, name: updates.name || project.name, color: updates.color || project.color, icon: updates.icon || project.icon });
                        setCreateProjectModalOpen(true);
                    }
                    return Promise.resolve(true);
                }}
                onDeleteProject={deleteProject}
                getProjectById={getProjectById}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <Header
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    viewDays={viewDays}
                    onViewDaysChange={setViewDays}
                    onAddTask={() => setSmartCaptureModalOpen(true)}
                    todayStreak={todayStreak}
                    activeTask={activeTask}
                    onPauseActiveTask={activeTask ? () => pauseTask(activeTask.id) : undefined}
                    onCompleteActiveTask={activeTask ? () => updateStatus(activeTask.id, 'completed') : undefined}
                    subtasksExpandedAll={subtasksExpandedAll}
                    onToggleSubtasksExpandedAll={() => setSubtasksExpandedAll(!subtasksExpandedAll)}
                />

                {/* Rollover Notification */}
                <RolloverNotification
                    rolledOverTasks={rolledOverTasks}
                    allTasks={tasks}
                    onDismiss={dismissRolloverNotification}
                />

                {/* Unblocked Tasks Notification */}
                <UnblockedTasksNotification
                    unblockedTasks={unblockedTasks}
                    onDismiss={dismissUnblockedNotification}
                    onMoveToToday={(taskId) => moveTask(taskId, formatDate(new Date()), 'anytime')}
                />

                {/* View Content */}
                {viewDays === 30 ? (
                    <CalendarView
                        currentDate={currentDate}
                        tasks={tasks}
                        projects={projects}
                        selectedProjectId={selectedProjectId}
                        selectedTaskId={selectedTaskId}
                        onSelectTask={setSelectedTaskId}
                        onDrop={handleDrop}
                        onEdit={handleEditTask}
                    />
                ) : (
                    <div className="flex gap-2 sm:gap-3 lg:gap-4 flex-1 overflow-hidden p-2 sm:p-3 lg:p-4">
                        {/* Main Day Columns */}
                        <div className={`flex-1 flex h-full min-w-0 ${
                            viewDays === 7 
                                ? 'gap-0.5 sm:gap-1' 
                                : viewDays === 1 
                                    ? 'gap-2 sm:gap-3' 
                                    : 'gap-2 sm:gap-3 lg:gap-4'
                        }`}>
                            {displayDays.map(day => (
                                <div 
                                    key={day.dateStr} 
                                    className={`flex flex-col flex-1 min-w-0 overflow-hidden ${
                                        viewDays === 7 
                                            ? 'flex-1' 
                                            : 'flex-1'
                                    }`}
                                >
                                    {/* Day Header */}
                                    <div className={`mb-1.5 sm:mb-2 flex items-center justify-between ${
                                        day.isToday ? 'text-purple-600' : day.isWeekend ? 'text-amber-600' : 'text-gray-500'
                                    }`}>
                                        <div className="min-w-0">
                                            <h3 className={`font-bold truncate ${viewDays === 7 ? 'text-xs sm:text-sm' : viewDays === 1 ? 'text-lg sm:text-xl' : 'text-sm sm:text-lg'}`}>
                                                {viewDays === 7 ? day.date.toLocaleDateString('en-US', { weekday: 'short' }) : day.display}
                                            </h3>
                                            <p className={`opacity-70 truncate ${viewDays === 7 ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}>
                                                {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        {day.isToday && (
                                            <span className={`font-bold bg-purple-100 text-purple-600 rounded-full ${viewDays === 7 ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'}`}>
                                                TODAY
                                            </span>
                                        )}
                                    </div>

                                    {/* Top 3 Priorities (only show on today in non-week view) */}
                                    {day.isToday && viewDays !== 7 && (
                                        <div className="mb-2">
                                            <Top3Section
                                                topPriorities={tasks.filter(t => t.isTopPriority && t.topPriorityDate === todayDateStr)}
                                                projects={projects}
                                                onEdit={handleEditTask}
                                                onSetPriorities={() => setDailyPrioritiesModalOpen(true)}
                                                onStatusChange={handleStatusChange}
                                            />
                                        </div>
                                    )}

                                    {/* Time Blocks */}
                                    <div className={`flex-1 overflow-y-auto pr-0.5 pb-2 ${viewDays === 7 ? 'space-y-0.5' : 'space-y-2'}`}>
                                        {TIME_BLOCKS
                                            .filter(block => {
                                                // For today, hide past time blocks
                                                if (!day.isToday) return true;
                                                
                                                const now = new Date();
                                                const currentHour = now.getHours();
                                                
                                                // Hide morning (6-12) if it's past noon
                                                if (block.id === 'morning' && currentHour >= 12) return false;
                                                // Hide afternoon (12-17) if it's past 5pm
                                                if (block.id === 'afternoon' && currentHour >= 17) return false;
                                                // Hide evening (17-22) if it's past 10pm
                                                if (block.id === 'evening' && currentHour >= 22) return false;
                                                
                                                return true;
                                            })
                                            .map(block => (
                                            <TimeBlockColumn
                                                key={`${day.dateStr}-${block.id}`}
                                                block={block}
                                                date={day.dateStr}
                                                tasks={day.tasks.filter(t => t.timeBlock === block.id)}
                                                allTasks={tasks}
                                                projects={projects}
                                                selectedTaskId={selectedTaskId}
                                                onSelectTask={setSelectedTaskId}
                                                onUpdate={updateTask}
                                                onStatusChange={handleStatusChange}
                                                onPause={pauseTask}
                                                onToggleSubtask={toggleSubtask}
                                                onStartDrag={handleStartDrag}
                                                onDrop={handleDrop}
                                                onDelete={deleteTask}
                                                onAIBreakdown={handleAIBreakdown}
                                                onUpdateSubtasks={handleUpdateSubtasks}
                                                onEdit={handleEditTask}
                                                compact={viewDays === 7}
                                                subtasksExpandedAll={subtasksExpandedAll}
                                            />
                                        ))}

                                        {/* Completed Tasks for this day */}
                                        {day.completedTasks.length > 0 && (
                                            <div className={`rounded-lg border border-green-200 bg-green-50/50 ${viewDays === 7 ? 'p-1' : 'p-2'}`}>
                                                <div className={`flex items-center gap-1 text-green-600 ${viewDays === 7 ? 'mb-0.5' : 'mb-1.5'}`}>
                                                    <CheckCircle2 size={viewDays === 7 ? 10 : 12} />
                                                    <span className={`font-medium ${viewDays === 7 ? 'text-[8px]' : 'text-[10px]'}`}>
                                                        Done ({day.completedTasks.length})
                                                    </span>
                                                </div>
                                                <div className={`${viewDays === 7 ? 'space-y-0.5' : 'space-y-1'} max-h-48 overflow-y-auto`}>
                                                    {day.completedTasks.map(task => {
                                                        const project = projects.find(p => p.id === task.projectId);
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className={`group relative flex items-center gap-1.5 ${viewDays === 7 ? 'py-0.5 px-1' : 'py-1 px-1.5'} bg-white/60 rounded border border-green-100 hover:bg-white transition-colors`}
                                                            >
                                                                <button
                                                                    onClick={() => updateStatus(task.id, 'pending')}
                                                                    className="flex-shrink-0 p-0.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                                    title="Restore task"
                                                                >
                                                                    <RotateCcw size={viewDays === 7 ? 10 : 12} />
                                                                </button>
                                                                {project && (
                                                                    <div 
                                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                                                                        style={{ backgroundColor: project.color }}
                                                                    />
                                                                )}
                                                                <span 
                                                                    className={`line-through text-gray-400 truncate flex-1 ${viewDays === 7 ? 'text-[8px]' : 'text-[10px]'}`}
                                                                >
                                                                    {task.title}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleEditTask(task)}
                                                                    className="flex-shrink-0 p-0.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded transition-colors"
                                                                    title="Edit task"
                                                                >
                                                                    <Pencil size={viewDays === 7 ? 10 : 12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteTask(task.id)}
                                                                    className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                    title="Delete task"
                                                                >
                                                                    <Trash2 size={viewDays === 7 ? 10 : 12} />
                                                                </button>
                                                                {/* Hover tooltip with details (2s delay) */}
                                                                {(task.description || task.estimatedMinutes || project) && viewDays !== 7 && (
                                                                    <div className="absolute left-0 bottom-full mb-1 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all delay-0 group-hover:delay-[2000ms] z-50 pointer-events-none">
                                                                        <div className="font-medium text-xs mb-1">{task.title}</div>
                                                                        {task.description && (
                                                                            <p className="text-gray-300 mb-1">{task.description}</p>
                                                                        )}
                                                                        <div className="flex items-center gap-2 text-gray-400">
                                                                            {project && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                                                                    {project.name}
                                                                                </span>
                                                                            )}
                                                                            {task.estimatedMinutes && (
                                                                                <span>{task.estimatedMinutes}m</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="absolute left-4 bottom-0 translate-y-full border-4 border-transparent border-t-gray-900" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upcoming Days Sidebar (1 and 3 day views) */}
                        {upcomingDays.length > 0 && (
                            <div className="w-20 sm:w-24 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
                                <h4 className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                                    Quick Nav
                                </h4>
                                <div className="flex flex-col gap-1.5">
                                    {upcomingDays.map(day => (
                                        <UpcomingDayColumn
                                            key={day.dateStr}
                                            dateStr={day.dateStr}
                                            dayName={day.dayName}
                                            fullDate={day.date}
                                            taskCount={day.taskCount}
                                            isWeekend={day.isWeekend}
                                            isToday={day.isToday}
                                            onDrop={handleDrop}
                                            onClick={(date) => {
                                                // Ensure we use a clean local midnight date
                                                const cleanDate = new Date(date);
                                                cleanDate.setHours(0, 0, 0, 0);
                                                setCurrentDate(cleanDate);
                                                setViewDays(1);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {taskForAI && (
                <AIBreakdownModal
                    task={taskForAI}
                    isOpen={aiModalOpen}
                    onClose={() => setAiModalOpen(false)}
                    onApply={handleApplyAIBreakdown}
                />
            )}

            {taskToEdit && (
                <EditTaskModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setTaskToEditId(null);
                    }}
                    onUpdate={updateTask}
                    task={taskToEdit}
                    projects={projects}
                    allTasks={tasks}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onDeleteSubtask={deleteSubtask}
                    onUpdateSubtask={updateSubtask}
                    onAddDependency={addDependency}
                    onRemoveDependency={removeDependency}
                />
            )}

            <CreateProjectModal
                isOpen={createProjectModalOpen}
                onClose={() => {
                    setCreateProjectModalOpen(false);
                    setEditingProject(null);
                }}
                onCreate={handleCreateProject}
                editProject={editingProject}
                onUpdate={(id, name, color, icon) => handleUpdateProject(id, { name, color, icon })}
            />

            <SmartCaptureModal
                isOpen={smartCaptureModalOpen}
                onClose={() => setSmartCaptureModalOpen(false)}
                onTasksCreated={refreshTasks}
            />

            <DailyPrioritiesModal
                isOpen={dailyPrioritiesModalOpen}
                onClose={handleCloseDailyPriorities}
                tasks={tasks}
                projects={projects}

                onSetTopPriorities={handleSetTopPriorities}
                existingTopPriorities={todayTopPriorities}
            />

            {/* Celebration message overlay */}
            <CelebrationMessage message={celebrationMessage} />
        </div>
    );
}
