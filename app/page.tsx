/**
 * FocusFlow - Main Application Page
 * 
 * This page composes the app from hooks and components.
 * All business logic lives in hooks, all UI in components.
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Brain } from 'lucide-react';

// Hooks
import { useTasks, useProjects } from '@/hooks';

// Components
import { Sidebar, Header } from '@/components/layout';
import { TaskCard } from '@/components/TaskCard';
import { TimeBlockColumn } from '@/components/TimeBlockColumn';
import { UpcomingDayColumn } from '@/components/UpcomingDayColumn';
import { AIBreakdownModal } from '@/components/AIBreakdownModal';
import { EditTaskModal } from '@/components/EditTaskModal';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { SmartCaptureModal } from '@/components/SmartCaptureModal';

// Utilities & Constants
import { formatDate, formatDisplayDate, addDays, isToday, getWeekStart, isWeekend } from '@/lib/utils/date';
import { TIME_BLOCKS } from '@/lib/constants';

// Types
import { Task, Subtask, TimeBlock, DragItem } from '@/types';

// ============================================
// Main Component
// ============================================

export default function FocusFlowApp() {
    const { data: session } = useSession();
    const isAuthenticated = !!session?.user?.id;

    // ============================================
    // Custom Hooks for State Management
    // ============================================

    const {
        tasks,
        loading,
        createTask,
        updateTask,
        deleteTask,
        updateStatus,
        moveTask,
        addSubtask,
        toggleSubtask,
        updateSubtask,
        deleteSubtask,
        addDependency,
        removeDependency,
        applyAIBreakdown,
        refreshTasks,
    } = useTasks({ isAuthenticated });

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
    const [viewDays, setViewDays] = useState(3);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [taskToEditId, setTaskToEditId] = useState<string | null>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [taskForAI, setTaskForAI] = useState<Task | null>(null);

    // Derive the current task to edit from the tasks array (stays in sync with subtask updates)
    const taskToEdit = useMemo(() => 
        taskToEditId ? tasks.find(t => t.id === taskToEditId) || null : null,
        [taskToEditId, tasks]
    );
    const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [smartCaptureModalOpen, setSmartCaptureModalOpen] = useState(false);

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

    const finishedTasks = useMemo(() =>
        tasks.filter(t =>
            t.status === 'completed' &&
            (!selectedProjectId || t.projectId === selectedProjectId)
        ),
        [tasks, selectedProjectId]
    );

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
            return {
                date,
                dateStr,
                display: formatDisplayDate(dateStr),
                isToday: isToday(dateStr),
                isWeekend: isWeekend(date),
                tasks: dayTasks,
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

    const handleStartDrag = useCallback((item: DragItem) => {
        console.log('Dragging', item);
    }, []);

    const handleDrop = useCallback(async (taskId: string, targetDate: string, targetBlock: TimeBlock) => {
        await moveTask(taskId, targetDate, targetBlock);
    }, [moveTask]);

    const handleCreateProject = useCallback(async (name: string, color: string, icon: string) => {
        await createProject({ name, color, icon });
    }, [createProject]);

    const handleUpdateProjectName = useCallback(async (id: string, name: string): Promise<boolean> => {
        return await updateProject(id, { name });
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
                finishedTasks={finishedTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onStatusChange={updateStatus}
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
                onUpdateProject={handleUpdateProjectName}
                onDeleteProject={deleteProject}
                getProjectById={getProjectById}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <Header
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    viewDays={viewDays}
                    onViewDaysChange={setViewDays}
                    onAddTask={() => setSmartCaptureModalOpen(true)}
                />

                {/* Timeline View */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 lg:p-4">
                    <div className="flex gap-2 sm:gap-3 lg:gap-4 h-full">
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
                                    className={`flex flex-col h-full min-w-0 ${
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

                                    {/* Time Blocks */}
                                    <div className={`flex-1 overflow-y-auto pr-0.5 pb-2 ${viewDays === 7 ? 'space-y-0.5' : 'space-y-2'}`}>
                                        {TIME_BLOCKS.map(block => (
                                            <TimeBlockColumn
                                                key={`${day.dateStr}-${block.id}`}
                                                block={block}
                                                date={day.dateStr}
                                                tasks={day.tasks.filter(t => t.timeBlock === block.id)}
                                                allTasks={tasks}
                                                projects={projects}
                                                selectedTaskId={selectedTaskId}
                                                onSelectTask={setSelectedTaskId}
                                                onStatusChange={updateStatus}
                                                onToggleSubtask={toggleSubtask}
                                                onStartDrag={handleStartDrag}
                                                onDrop={handleDrop}
                                                onDelete={deleteTask}
                                                onAIBreakdown={handleAIBreakdown}
                                                onUpdateSubtasks={handleUpdateSubtasks}
                                                onEdit={handleEditTask}
                                                compact={viewDays === 7}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upcoming Days Sidebar (1 and 3 day views) */}
                        {upcomingDays.length > 0 && (
                            <div className="w-20 sm:w-24 flex-shrink-0 flex flex-col gap-2">
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
                </div>
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
                onClose={() => setCreateProjectModalOpen(false)}
                onCreate={handleCreateProject}
            />

            <SmartCaptureModal
                isOpen={smartCaptureModalOpen}
                onClose={() => setSmartCaptureModalOpen(false)}
                onTasksCreated={refreshTasks}
            />
        </div>
    );
}
