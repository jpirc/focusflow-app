/**
 * Dopatika - Main Application Page
 * 
 * This page composes the app from hooks and components.
 * All business logic lives in hooks, all UI in components.
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Brain, CheckCircle2, RotateCcw, Pencil, Trash2 } from 'lucide-react';

// Hooks
import { useTasks, useProjects, useCelebration, useTheme, usePomodoro } from '@/hooks';
import { useViewState } from '@/hooks/useViewState';
import { useModalState } from '@/hooks/useModalState';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { useLocalStorageMigration } from '@/hooks/useLocalStorageMigration';
import { useMobileBreakpoint } from '@/hooks/useBreakpoint';

// Components
import { Sidebar, Header } from '@/components/layout';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { PomodoroOverlay } from '@/components/PomodoroOverlay';
import { QuickEditTaskCard } from '@/components/QuickEditTaskCard';
import { TimeBlockColumn } from '@/components/TimeBlockColumn';
import { TimelineView } from '@/components/TimelineView';
import { UpcomingDayColumn } from '@/components/UpcomingDayColumn';
import { CalendarView } from '@/components/CalendarView';
import { AIBreakdownModal } from '@/components/AIBreakdownModal';
import { EditTaskModal } from '@/components/EditTaskModal';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { SmartCaptureModal } from '@/components/SmartCaptureModal';
import { CelebrationMessage } from '@/components/CelebrationMessage';
import { DailyPrioritiesModal } from '@/components/DailyPrioritiesModal';
import { RestartMyDayModal } from '@/components/RestartMyDayModal';
import { Top3Section } from '@/components/Top3Section';
import { RolloverNotification } from '@/components/RolloverNotification';
import { UnblockedTasksNotification } from '@/components/UnblockedTasksNotification';
import { QuickWinSuggestions } from '@/components/QuickWinSuggestions';
import DualPanelLayout from '@/components/DualPanelLayout';
import TimelinePanel from '@/components/TimelinePanel';
import { TimeBudget } from '@/components/ui/TimeBudget';

// Mobile Components
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MobileTimeBlocksView } from '@/components/mobile/MobileTimeBlocksView';
import { MobileTimelineView } from '@/components/mobile/MobileTimelineView';
import { MobileFAB } from '@/components/mobile/MobileFAB';

// Utilities & Constants
import { formatDate, formatDisplayDate, addDays, isToday, getWeekStart, isWeekend, getRelativeDayLabel } from '@/lib/utils/date';
import { TIME_BLOCKS } from '@/lib/constants';
import { smartReschedule, saveRestartNote } from '@/lib/utils/reschedule';

// Types
import { Task, Subtask, TimeBlock, DragItem, TaskStatus, Project } from '@/types';

// ============================================
// Main Component
// ============================================

export default function DopatikaApp() {
    const { data: session } = useSession();
    const isAuthenticated = !!session?.user?.id;

    // Run localStorage migration from FocusFlow to Dopatika (one-time)
    useLocalStorageMigration();

    // Mobile responsiveness
    const isMobile = useMobileBreakpoint();
    const [mobileTab, setMobileTab] = useState<'today' | 'timeline' | 'inbox' | 'projects' | 'more'>('today');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // ============================================
    // Custom Hooks for State Management
    // ============================================
    // Hooks
    // ============================================

    // Theme system
    const { theme, changeTheme } = useTheme();

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

    // Pomodoro timer system
    const pomodoro = usePomodoro({
        isAuthenticated,
        onPomodoroComplete: () => {
            celebrate();
            incrementStreak();
        },
        onTaskStart: (taskId) => {
            // Update task status to in-progress when Pomodoro starts
            handleStatusChange(taskId, 'in-progress');
        },
        onSessionComplete: () => {
            // Refresh tasks to get updated actualMinutes
            refreshTasks();
        },
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
        startTaskNow,
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

    // View state (date, viewDays, viewMode, sidebar)
    const {
        currentDate,
        setCurrentDate,
        viewDays,
        setViewDays,
        viewMode,
        setViewMode,
        sidebarOpen,
        setSidebarOpen,
    } = useViewState();

    // Modal state
    const modalState = useModalState();
    const {
        editModalOpen,
        setEditModalOpen,
        taskToEditId,
        setTaskToEditId,
        aiModalOpen,
        setAiModalOpen,
        taskForAI,
        setTaskForAI,
        createProjectModalOpen,
        setCreateProjectModalOpen,
        editingProject,
        setEditingProject,
        smartCaptureModalOpen,
        setSmartCaptureModalOpen,
        dailyPrioritiesModalOpen,
        setDailyPrioritiesModalOpen,
        quickWinModalOpen,
        setQuickWinModalOpen,
        quickWinTrigger,
        setQuickWinTrigger,
        openEditModal,
        closeEditModal,
        openAIModal,
        closeAIModal,
        openProjectModal,
        closeProjectModal,
    } = modalState;

    // Restart My Day modal state
    const [restartDayModalOpen, setRestartDayModalOpen] = useState(false);

    // Task selection state (local to page)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedTimelineTaskId, setSelectedTimelineTaskId] = useState<string | null>(null);
    const [hoveredTimelineTaskId, setHoveredTimelineTaskId] = useState<string | null>(null);
    const [subtasksExpandedAll, setSubtasksExpandedAll] = useState(true);

    // Derive the current task to edit from the tasks array
    const taskToEdit = useMemo(() =>
        taskToEditId ? tasks.find(t => t.id === taskToEditId) || null : null,
        [taskToEditId, tasks]
    );

    // ============================================
    // Computed Values & Filters
    // ============================================

    const {
        inboxTasks,
        todayDateStr,
        todayTopPriorities,
        activeTask,
        displayDays,
        timeFilter,
        setTimeFilter,
        timeFilterCounts,
    } = useTaskFilters({
        tasks,
        projects,
        currentDate,
        viewDays,
        selectedProjectId,
    });

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
                    t.date && formatDate(t.date) === dateStr && 
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
            // Quick Win shortcut: Cmd+W
            if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
                e.preventDefault();
                setQuickWinTrigger('manual');
                setQuickWinModalOpen(true);
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
            const dismissedKey = `dopatika_top3_dismissed_${todayDateStr}`;
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
        const dismissedKey = `dopatika_top3_dismissed_${todayDateStr}`;
        localStorage.setItem(dismissedKey, 'true');
    }, [todayDateStr]);

    const handleSetTopPriorities = useCallback(async (taskIds: string[]) => {
        await setTopPriorities(taskIds, todayDateStr);
        setDailyPrioritiesModalOpen(false);
    }, [setTopPriorities, todayDateStr]);

    const handleRestartDay = useCallback(async (note?: string) => {
        try {
            // Get today's incomplete tasks
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = formatDate(today);

            const incompleteTasks = tasks.filter(t =>
                t.date === todayStr &&
                t.status !== 'completed' &&
                t.timeBlock !== 'inbox'
            );

            console.log(`[RestartDay] Rescheduling ${incompleteTasks.length} incomplete tasks`);

            // Save note if provided
            if (note) {
                saveRestartNote(note);
            }

            // Run smart reschedule algorithm (use current time, NOT midnight)
            const now = new Date(); // Current time with actual hours/minutes
            const rescheduleResults = smartReschedule(incompleteTasks, now);

            console.log(`[RestartDay] Algorithm returned ${rescheduleResults.length} scheduled tasks`);

            // Apply updates to each task
            const updatePromises = rescheduleResults.map(result => {
                return updateTask(result.taskId, {
                    scheduledHour: result.scheduledHour,
                    scheduledMinute: result.scheduledMinute,
                    timeBlock: result.timeBlock,
                });
            });

            await Promise.all(updatePromises);

            console.log('[RestartDay] All tasks rescheduled successfully');

            // Refresh to show updated schedule
            await refreshTasks();

        } catch (error) {
            console.error('[RestartDay] Failed to restart day:', error);
            throw error;
        }
    }, [tasks, updateTask, refreshTasks]);

    // Timeline panel handlers
    const handleTimelineTaskClick = useCallback((taskId: string) => {
        setSelectedTimelineTaskId(taskId);
        setSelectedTaskId(taskId);
        // TODO: Scroll task into view in time block column
    }, []);
    
    const handleTimelineTaskHover = useCallback((taskId: string | null) => {
        setHoveredTimelineTaskId(taskId);
    }, []);

    // Time block panel hover handler (syncs with timeline)
    const handleTaskHover = useCallback((taskId: string | null) => {
        setHoveredTimelineTaskId(taskId);
    }, []);
    
    const handleTimelineTaskDragStart = useCallback((task: Task, e: React.DragEvent) => {
        handleStartDrag({
            taskId: task.id,
            sourceDate: task.date,
            sourceTimeBlock: task.timeBlock
        });
    }, []);

    const handleStartDrag = useCallback((item: DragItem) => {
        console.log('Dragging', item);
    }, []);

    // Handle drop on timeline - set specific scheduled time
    const handleTimelineDrop = useCallback(async (taskId: string, hour: number, minute: number, targetDate?: string) => {
        console.log(`Dropping task ${taskId} at ${hour}:${minute} on ${targetDate}`);

        try {
            // Determine which time block this hour belongs to
            let newTimeBlock: TimeBlock = 'anytime';
            if (hour >= 6 && hour < 12) {
                newTimeBlock = 'morning';
            } else if (hour >= 12 && hour < 17) {
                newTimeBlock = 'afternoon';
            } else if (hour >= 17 && hour < 22) {
                newTimeBlock = 'evening';
            }

            // If no target date specified, use current date (for inbox tasks)
            const dateToSet = targetDate || formatDate(new Date());

            await updateTask(taskId, {
                scheduledHour: hour,
                scheduledMinute: minute,
                timeBlock: newTimeBlock,
                date: dateToSet, // Important: set the date so task appears on the timeline
            });
        } catch (error) {
            console.error('Failed to schedule task:', error);
        }
    }, [updateTask]);

    // Handle unschedule - remove from timeline, return to inbox
    const handleUnschedule = useCallback(async (taskId: string) => {
        try {
            await updateTask(taskId, {
                scheduledHour: null,
                scheduledMinute: null,
                timeBlock: 'inbox',
                date: null,
            });
        } catch (error) {
            console.error('Failed to unschedule task:', error);
        }
    }, [updateTask]);

    // Handle Start Now - Quick start without Pomodoro timer
    // Just schedules task and sets to in-progress (use Start Pomodoro button for timer)
    const handleStartNow = useCallback(async (taskId: string) => {
        try {
            // Schedule + set in-progress (no timer)
            await startTaskNow(taskId);
        } catch (error) {
            console.error('Failed to start task now:', error);
            // Error is already handled in startTaskNow (shows in UI)
        }
    }, [startTaskNow]);

    // Wrap updateStatus to trigger celebration on completion
    const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
        console.log('[handleStatusChange] Called with:', { taskId, status });
        await updateStatus(taskId, status);
        if (status === 'completed') {
            console.log('[handleStatusChange] Task completed! Triggering celebration...');
            const newStreak = incrementStreak();
            celebrate(newStreak);
            console.log('[handleStatusChange] Celebration triggered with streak:', newStreak);

            // Show quick win suggestions after completing a task (30% chance)
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    setQuickWinTrigger('completion');
                    setQuickWinModalOpen(true);
                }, 1500); // Show after celebration animation
            }
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
            // If moving from timeline to time block, clear scheduled time
            const updates: Partial<Task> = {};
            if (task.scheduledHour !== null || task.scheduledMinute !== null) {
                updates.scheduledHour = undefined;
                updates.scheduledMinute = undefined;
            }
            
            // Find available time slot if moving to a time block (not inbox)
            if (targetBlock !== 'inbox') {
                const blockTasks = tasks.filter(t => 
                    t.date === targetDate && 
                    t.timeBlock === targetBlock &&
                    t.scheduledHour !== null && 
                    t.scheduledHour !== undefined &&
                    t.status !== 'completed' // Skip completed tasks - they're ghosts
                ).sort((a, b) => {
                    const aTime = (a.scheduledHour || 0) * 60 + (a.scheduledMinute || 0);
                    const bTime = (b.scheduledHour || 0) * 60 + (b.scheduledMinute || 0);
                    return aTime - bTime;
                });

                // Determine time block range
                const timeRanges = {
                    morning: { start: 6, end: 12 },
                    afternoon: { start: 12, end: 17 },
                    evening: { start: 17, end: 22 },
                    anytime: { start: 6, end: 22 },
                };
                const range = timeRanges[targetBlock as keyof typeof timeRanges];

                if (range && blockTasks.length > 0) {
                    // Find first available slot after existing tasks
                    const lastTask = blockTasks[blockTasks.length - 1];
                    const lastTaskEnd = (lastTask.scheduledHour || 0) + Math.ceil((lastTask.estimatedMinutes || 30) / 60);
                    
                    if (lastTaskEnd < range.end) {
                        updates.scheduledHour = Math.min(lastTaskEnd, range.end - 1);
                        updates.scheduledMinute = 0;
                    }
                } else if (range) {
                    // No tasks in this block yet, use start of range
                    updates.scheduledHour = range.start;
                    updates.scheduledMinute = 0;
                }
            }
            
            await moveTask(taskId, targetDate, targetBlock);
            if (Object.keys(updates).length > 0) {
                await updateTask(taskId, updates);
            }
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
                    <p className="text-gray-600 font-medium">Loading Dopatika...</p>
                </div>
            </div>
        );
    }

    // ============================================
    // Render
    // ============================================

    // Mobile Layout
    if (isMobile) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
                {/* Mobile Header */}
                <MobileHeader
                    title={mobileTab === 'today' ? 'Today' : mobileTab === 'timeline' ? 'Timeline' : mobileTab === 'inbox' ? 'Inbox' : mobileTab === 'projects' ? 'Projects' : 'More'}
                    date={currentDate}
                    onMenuClick={() => setMobileDrawerOpen(true)}
                    onSettingsClick={() => window.location.href = '/settings'}
                />

                {/* Main Content - Scrollable */}
                <main className="flex-1 overflow-auto pb-20">
                    {/* Today Tab */}
                    {mobileTab === 'today' && (
                        <>
                            {/* Top 3 Section */}
                            <div className="bg-white border-b border-gray-200 p-4">
                                <Top3Section
                                    topPriorities={tasks.filter(t => t.isTopPriority && t.topPriorityDate === todayDateStr)}
                                    projects={projects}
                                    onEdit={handleEditTask}
                                    onSetPriorities={() => setDailyPrioritiesModalOpen(true)}
                                    onStatusChange={handleStatusChange}
                                    onStartNow={handleStartNow}
                                    mode="full"
                                />
                            </div>

                            {/* Time Budget */}
                            <div className="bg-white border-b border-gray-200 p-4">
                                <TimeBudget
                                    tasks={todayTasks}
                                    overloadedBlocks={Object.keys(overloadedBlocks)}
                                />
                            </div>

                            {/* Time Blocks */}
                            <MobileTimeBlocksView
                                tasks={todayTasks}
                                onTaskTap={(task) => {
                                    setEditingTask(task);
                                    setTaskModalOpen(true);
                                }}
                                onTaskStart={(task) => {
                                    handleStartTask(task.id);
                                    pomodoro.startPomodoro(task);
                                }}
                                onTaskComplete={(taskId) => updateStatus(taskId, 'completed')}
                            />
                        </>
                    )}

                    {/* Timeline Tab */}
                    {mobileTab === 'timeline' && (
                        <MobileTimelineView
                            tasks={todayTasks}
                            onTaskTap={(task) => {
                                setEditingTask(task);
                                setTaskModalOpen(true);
                            }}
                            onTaskStart={(task) => {
                                handleStartTask(task.id);
                                pomodoro.startPomodoro(task);
                            }}
                            onTaskComplete={(taskId) => updateStatus(taskId, 'completed')}
                        />
                    )}

                    {/* Inbox Tab */}
                    {mobileTab === 'inbox' && (
                        <div className="p-4 space-y-3">
                            <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
                            {inboxTasks.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="text-gray-300 text-5xl mb-3">📭</div>
                                    <p className="text-gray-500 font-medium">Inbox is empty</p>
                                    <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                inboxTasks.map((task) => (
                                    <div key={task.id}>
                                        <MobileTaskCard
                                            task={task}
                                            onTap={() => {
                                                setEditingTask(task);
                                                setTaskModalOpen(true);
                                            }}
                                            onStart={() => {
                                                handleStartTask(task.id);
                                                pomodoro.startPomodoro(task);
                                            }}
                                            onToggleComplete={() => updateStatus(task.id, task.completed ? 'pending' : 'completed')}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Projects Tab */}
                    {mobileTab === 'projects' && (
                        <div className="p-4 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                            {projects.map((project) => {
                                const projectTasks = tasks.filter(t => t.projectId === project.id);
                                return (
                                    <div key={project.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                                            <h3 className="font-semibold text-base">{project.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600">{projectTasks.length} tasks</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* More Tab */}
                    {mobileTab === 'more' && (
                        <div className="p-4 space-y-2">
                            <button
                                onClick={() => window.location.href = '/analytics'}
                                className="w-full min-h-[56px] bg-white rounded-lg p-4 text-left border border-gray-200 active:bg-gray-50"
                            >
                                <div className="font-medium">Analytics</div>
                                <div className="text-sm text-gray-600">View your productivity stats</div>
                            </button>
                            <button
                                onClick={() => window.location.href = '/settings'}
                                className="w-full min-h-[56px] bg-white rounded-lg p-4 text-left border border-gray-200 active:bg-gray-50"
                            >
                                <div className="font-medium">Settings</div>
                                <div className="text-sm text-gray-600">Manage your preferences</div>
                            </button>
                        </div>
                    )}
                </main>

                {/* Bottom Navigation */}
                <MobileBottomNav
                    activeTab={mobileTab}
                    onTabChange={setMobileTab}
                    inboxCount={inboxTasks.length}
                />

                {/* FAB */}
                <MobileFAB onClick={() => setSmartCaptureModalOpen(true)} />

                {/* Modals (shared with desktop) */}
                {taskModalOpen && editingTask && (
                    <EditTaskModal
                        task={editingTask}
                        onClose={() => {
                            setTaskModalOpen(false);
                            setEditingTask(null);
                        }}
                        onUpdate={(updates) => {
                            updateTask(editingTask.id, updates);
                            setTaskModalOpen(false);
                            setEditingTask(null);
                        }}
                        onDelete={() => {
                            deleteTask(editingTask.id);
                            setTaskModalOpen(false);
                            setEditingTask(null);
                        }}
                        projects={projects}
                    />
                )}

                {smartCaptureModalOpen && (
                    <SmartCaptureModal
                        isOpen={smartCaptureModalOpen}
                        onClose={() => setSmartCaptureModalOpen(false)}
                        onTaskCreated={createTask}
                        currentDate={formatDate(currentDate)}
                    />
                )}

                {/* Pomodoro Timer */}
                {pomodoro.isRunning && (
                    <PomodoroTimer pomodoro={pomodoro} />
                )}
            </div>
        );
    }

    // Desktop Layout
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
                onStartNow={handleStartNow}
                timeFilter={timeFilter}
                onTimeFilterChange={setTimeFilter}
                timeFilterCounts={timeFilterCounts}
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
                theme={theme}
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
                    onQuickWin={() => {
                        setQuickWinTrigger('manual');
                        setQuickWinModalOpen(true);
                    }}
                    onRestartDay={() => setRestartDayModalOpen(true)}
                    todayStreak={todayStreak}
                    activeTask={activeTask}
                    onPauseActiveTask={activeTask ? () => pauseTask(activeTask.id) : undefined}
                    onCompleteActiveTask={activeTask ? () => updateStatus(activeTask.id, 'completed') : undefined}
                    subtasksExpandedAll={subtasksExpandedAll}
                    onToggleSubtasksExpandedAll={() => setSubtasksExpandedAll(!subtasksExpandedAll)}
                    theme={theme}
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
                                    <div className={`mb-1.5 sm:mb-2 space-y-2`}>
                                        <div className={`flex items-center justify-between ${
                                            day.isToday ? 'text-blue-600' : day.isWeekend ? 'text-amber-600' : 'text-gray-500'
                                        }`}>
                                            <div className="min-w-0 flex-1">
                                                {viewDays === 7 ? (
                                                    <>
                                                        <h3 className="font-bold truncate text-xs sm:text-sm">
                                                            {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                        </h3>
                                                        <p className="opacity-70 truncate text-[9px]">
                                                            {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className={`font-bold truncate ${viewDays === 1 ? 'text-lg sm:text-xl' : 'text-sm sm:text-lg'}`}>
                                                            {getRelativeDayLabel(day.date)}
                                                        </h3>
                                                        <p className={`opacity-70 ${viewDays === 1 ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>
                                                            {day.date.toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                        <div className="flex items-center gap-2">
                            {/* View Toggle (only show in 1-day view) */}
                            {viewDays === 1 && (
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                    <button
                                        onClick={() => {
                                            setViewMode('blocks');
                                            localStorage.setItem('dopatika_view_mode', 'blocks');
                                        }}
                                        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                                            viewMode === 'blocks'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="Time blocks only"
                                    >
                                        Blocks
                                    </button>
                                    <button
                                        onClick={() => {
                                            setViewMode('timeline');
                                            localStorage.setItem('dopatika_view_mode', 'timeline');
                                        }}
                                        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                                            viewMode === 'timeline'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="Dual panel: blocks + timeline"
                                    >
                                        Dual
                                    </button>
                                </div>
                            )}
                            {day.isToday && (
                                <span className={`font-bold bg-blue-100 text-blue-600 rounded-full ${viewDays === 7 ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'}`}>
                                    TODAY
                                </span>
                            )}
                        </div>
                        </div>

                        {/* Time Budget - Show only in 1-day and 3-day views */}
                        {viewDays <= 3 && (
                            <div className="px-1">
                                <TimeBudget
                                    scheduledMinutes={day.tasks.reduce((total, task) =>
                                        total + (task.estimatedMinutes || task.estimatedDuration || 30), 0
                                    )}
                                    completedMinutes={day.completedTasks.reduce((total, task) =>
                                        total + (task.estimatedMinutes || task.estimatedDuration || 30), 0
                                    )}
                                    mode="compact"
                                    startHour={8}
                                    endHour={18}
                                />
                            </div>
                        )}
                    </div>

                    {/* Top 3 Priorities (only show on today in non-week view) */}
                    {day.isToday && viewDays !== 7 && (
                        <div className="mb-1">
                            <Top3Section
                                topPriorities={tasks.filter(t => t.isTopPriority && t.topPriorityDate === todayDateStr)}
                                projects={projects}
                                onEdit={handleEditTask}
                                onSetPriorities={() => setDailyPrioritiesModalOpen(true)}
                                onStatusChange={handleStatusChange}
                                onStartNow={handleStartNow}
                                theme={theme}
                                mode="compact"
                            />
                        </div>
                    )}

                    {/* Time Blocks or Timeline View */}
                    <div className="flex-1 overflow-hidden">
                        {viewDays === 1 && viewMode === 'timeline' ? (
                            /* Dual Panel Layout: Time Blocks (67%) + Timeline (33%) */
                            <DualPanelLayout
                                timeBlocksPanel={
                                    <div className="h-full overflow-y-auto pr-0.5 pb-2 space-y-2 px-2">
                                        {TIME_BLOCKS
                                            .filter(block => {
                                                // Hide anytime block
                                                if (block.id === 'anytime') return false;
                                                
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
                                                    tasks={day.tasks
                                                        .filter(t => t.timeBlock === block.id)
                                                        .sort((a, b) => {
                                                            // Sort by scheduled time first (if exists)
                                                            if (a.scheduledHour !== null && a.scheduledHour !== undefined &&
                                                                b.scheduledHour !== null && b.scheduledHour !== undefined) {
                                                                const aTime = a.scheduledHour * 60 + (a.scheduledMinute || 0);
                                                                const bTime = b.scheduledHour * 60 + (b.scheduledMinute || 0);
                                                                if (aTime !== bTime) return aTime - bTime;
                                                            }
                                                            // Scheduled tasks come before unscheduled
                                                            if ((a.scheduledHour !== null && a.scheduledHour !== undefined) &&
                                                                (b.scheduledHour === null || b.scheduledHour === undefined)) return -1;
                                                            if ((a.scheduledHour === null || a.scheduledHour === undefined) &&
                                                                (b.scheduledHour !== null && b.scheduledHour !== undefined)) return 1;
                                                            // Fall back to order field
                                                            return (a.order || 0) - (b.order || 0);
                                                        })
                                                    }
                                                    allTasks={tasks}
                                                    projects={projects}
                                                    selectedTaskId={selectedTaskId}
                                                    onStartNow={handleStartNow}
                                                    highlightedTaskId={hoveredTimelineTaskId}
                                                    onSelectTask={setSelectedTaskId}
                                                    onHoverTask={handleTaskHover}
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
                                                    onStartPomodoro={(task) => pomodoro.startPomodoro(task)}
                                                    onUnschedule={handleUnschedule}
                                                    compact={true}
                                                    subtasksExpandedAll={subtasksExpandedAll}
                                                    theme={theme}
                                                />
                                            ))}
                                        
                                        {/* Completed Tasks for this day */}
                                        {day.completedTasks.length > 0 && (
                                            <div className="rounded-lg border border-green-200 bg-green-50/50 p-2">
                                                <div className="flex items-center gap-1 text-green-600 mb-1.5">
                                                    <CheckCircle2 size={12} />
                                                    <span className="font-medium text-[10px]">
                                                        Done ({day.completedTasks.length})
                                                    </span>
                                                </div>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {day.completedTasks.map(task => {
                                                        const project = projects.find(p => p.id === task.projectId);
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className="group relative flex items-center gap-1.5 py-1 px-1.5 bg-white/60 rounded border border-green-100 hover:bg-white transition-colors"
                                                            >
                                                                <button
                                                                    onClick={() => handleStatusChange(task.id, 'pending')}
                                                                    className="flex-shrink-0 p-0.5 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                                                                    title="Mark incomplete"
                                                                >
                                                                    <RotateCcw size={12} />
                                                                </button>
                                                                <span className="flex-1 text-xs line-through text-gray-500 truncate">
                                                                    {task.title}
                                                                </span>
                                                                {project && (
                                                                    <div
                                                                        className="flex-shrink-0 w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: project.color }}
                                                                        title={project.name}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                }
                                timelinePanel={
                                    <TimelinePanel
                                        tasks={day.timelineTasks}
                                        allTasks={tasks}
                                        date={day.dateStr}
                                        projects={projects}
                                        selectedTaskId={selectedTimelineTaskId}
                                        hoveredTaskId={hoveredTimelineTaskId}
                                        onTaskClick={handleTimelineTaskClick}
                                        onTaskHover={handleTimelineTaskHover}
                                        onTaskDragStart={handleTimelineTaskDragStart}
                                        onTaskDrop={handleTimelineDrop}
                                        onUpdate={updateTask}
                                        onEdit={handleEditTask}
                                        onUnschedule={handleUnschedule}
                                        onStartNow={handleStartNow}
                                        onStartPomodoro={pomodoro.startPomodoro}
                                    />
                                }
                            />
                        ) : (
                            <div className={`h-full overflow-y-auto pr-0.5 pb-2 ${viewDays === 7 ? 'space-y-0.5' : 'space-y-2'}`}>
                                {TIME_BLOCKS
                                            .filter(block => {
                                                // Hide anytime block
                                                if (block.id === 'anytime') return false;
                                                
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
                                                highlightedTaskId={hoveredTimelineTaskId}
                                                onSelectTask={setSelectedTaskId}
                                                onHoverTask={handleTaskHover}
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
                                                onStartPomodoro={(task) => pomodoro.startPomodoro(task)}
                                                onUnschedule={handleUnschedule}
                                                onStartNow={handleStartNow}
                                                compact={viewDays === 7}
                                                subtasksExpandedAll={subtasksExpandedAll}
                                                theme={theme}
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
                                            theme={theme}
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
                    theme={theme}
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
                theme={theme}
            />

            <QuickWinSuggestions
                isOpen={quickWinModalOpen}
                onClose={() => setQuickWinModalOpen(false)}
                tasks={tasks}
                projects={projects}
                onSelectTask={handleEditTask}
                onStartTask={(taskId) => {
                    handleStatusChange(taskId, 'in-progress');
                }}
                trigger={quickWinTrigger}
                theme={theme}
            />

            <RestartMyDayModal
                isOpen={restartDayModalOpen}
                onClose={() => setRestartDayModalOpen(false)}
                tasks={tasks}
                projects={projects}
                onRestart={handleRestartDay}
                theme={theme}
            />

            {/* Celebration message overlay */}
            <CelebrationMessage message={celebrationMessage} theme={theme} />

            {/* Pomodoro visual overlay */}
            <PomodoroOverlay
                timerState={pomodoro.timerState}
                isActive={pomodoro.isActive}
                isPaused={pomodoro.isPaused}
                timeRemaining={pomodoro.timeRemaining}
                mode={pomodoro.settings.overlayMode}
            />

            {/* Pomodoro timer widget */}
            <PomodoroTimer
                timerState={pomodoro.timerState}
                isActive={pomodoro.isActive}
                isPaused={pomodoro.isPaused}
                timeRemaining={pomodoro.timeRemaining}
                currentTask={pomodoro.currentTask}
                sessionNumber={pomodoro.sessionNumber}
                onPause={pomodoro.pausePomodoro}
                onResume={pomodoro.resumePomodoro}
                onStop={() => pomodoro.stopPomodoro(true)}
                onCompleteTask={(taskId) => handleStatusChange(taskId, 'completed')}
                settings={pomodoro.settings}
                updateSettings={pomodoro.updateSettings}
                theme={theme}
            />
        </div>
    );
}
