/**
 * Sidebar Component - Inbox and project navigation
 */

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Settings,
    MoreVertical,
    ChevronDown,
    ChevronRight,
    FolderKanban,
    PanelLeftClose,
    PanelLeft,
    BarChart3,
    ListTodo,
} from 'lucide-react';
import { Task, Project } from '@/types';
import { CompactInboxTask } from '@/components/CompactInboxTask';
import { TimeFilterButtons } from '@/components/ui/TimeFilterButtons';
import { Theme } from '@/lib/themes';

const projectIconMap: Record<string, string> = {
    // Work & Business
    briefcase: '💼', laptop: '💻', chart: '📊', calendar: '📅', clipboard: '📋',
    phone: '📱', email: '📧', rocket: '🚀',
    // Learning & Knowledge
    book: '📚', graduation: '🎓', lightbulb: '💡', pencil: '✏️', notebook: '📓', microscope: '🔬',
    // Life & Health
    heart: '❤️', dumbbell: '💪', apple: '🍎', yoga: '🧘', running: '🏃', bicycle: '🚴',
    // Home & Family
    home: '🏠', family: '👨‍👩‍👧‍👦', baby: '👶', pet: '🐕', plant: '🌱', cooking: '🍳',
    // Creative & Hobbies
    art: '🎨', music: '🎵', camera: '📷', game: '🎮', guitar: '🎸', movie: '🎬',
    // Finance & Money
    money: '💰', bank: '🏦', 'chart-up': '📈', piggy: '🐷', 'credit-card': '💳',
    // Goals & Targets
    target: '🎯', trophy: '🏆', star: '⭐', fire: '🔥', gem: '💎', crown: '👑',
    // Travel & Adventure
    plane: '✈️', world: '🌍', beach: '🏖️', mountain: '⛰️', camping: '🏕️',
    // General & Misc
    folder: '📁', coffee: '☕', pizza: '🍕', gift: '🎁', balloon: '🎈',
    sunny: '☀️', moon: '🌙', rainbow: '🌈',
};

function isTaskBlocked(task: Task): boolean {
    const dependencies = task.dependencies || [];
    if (dependencies.length === 0) return false;

    return dependencies.some(dep => {
        if (!dep.dependsOn) return true;
        return dep.dependsOn.status !== 'completed' && dep.dependsOn.completed !== true;
    });
}

interface SidebarProps {
    // State
    isOpen: boolean;
    onToggle: () => void;
    userName?: string | null;

    // Inbox (unscheduled tasks)
    queueTasks: Task[];
    queueCount: number;
    selectedTaskId: string | null;
    onSelectTask: (id: string | null) => void;

    // Time filter
    timeFilter: number | null;
    onTimeFilterChange: (minutes: number | null) => void;
    timeFilterCounts?: {
        '15': number;
        '30': number;
        '60': number;
        '120': number;
        all: number;
    };

    // Task handlers
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStatusChange: (id: string, status: any) => void;
    onPause: (id: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onStartDrag: (item: any) => void;
    onDelete: (id: string) => void;
    onAIBreakdown: (task: Task) => void;
    onUpdateSubtasks: (taskId: string, subtasks: any[]) => void;
    onEdit: (task: Task) => void;
    onStartNow: (taskId: string) => Promise<void>;

    // Projects
    projects: Project[];
    selectedProjectId: string | null;
    onSelectProject: (id: string | null) => void;
    onCreateProject: () => void;
    onUpdateProject: (id: string, updates: { name?: string; color?: string; icon?: string }) => Promise<boolean>;
    onDeleteProject: (id: string) => void;
    getProjectById: (id: string | undefined) => Project;
    theme?: Theme;
}

export function Sidebar({
    isOpen,
    onToggle,
    userName,
    queueTasks,
    queueCount,
    selectedTaskId,
    onSelectTask,
    onUpdate,
    onStatusChange,
    onPause,
    onToggleSubtask,
    onStartDrag,
    onDelete,
    onAIBreakdown,
    onUpdateSubtasks,
    onEdit,
    onStartNow,
    timeFilter,
    onTimeFilterChange,
    timeFilterCounts,
    projects,
    selectedProjectId,
    onSelectProject,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    getProjectById,
    theme,
}: SidebarProps) {
    // Project menu state
    const [projectMenuOpenId, setProjectMenuOpenId] = useState<string | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    // Collapsible section state
    const [projectsCollapsed, setProjectsCollapsed] = useState(false);
    const visibleQueueCount = timeFilter === null ? queueCount : queueTasks.length;

    const recommendedTask = queueTasks[0];
    const recommendationReason = useMemo(() => {
        if (!recommendedTask) return '';

        const isReady = (recommendedTask.dependencies || []).every(dep => {
            if (!dep.dependsOn) return false;
            return dep.dependsOn.status === 'completed' || dep.dependsOn.completed === true;
        });

        if (!isReady && (recommendedTask.dependencies || []).length > 0) {
            return 'Blocked by dependency - finish blocker first.';
        }

        if ((recommendedTask.rolloverCount || 0) >= 3) {
            return `Rolled ${recommendedTask.rolloverCount}x - tiny progress wins.`;
        }

        if ((recommendedTask.estimatedMinutes || 30) <= 15) {
            return 'Quick win (<15m) to build momentum.';
        }

        if (recommendedTask.priority === 'urgent' || recommendedTask.priority === 'high') {
            return 'High priority and ready to execute.';
        }

        const ageInDays = Math.floor((Date.now() - new Date(recommendedTask.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (ageInDays >= 7) {
            return 'Older task - clearing backlog reduces mental drag.';
        }

        return 'Best next step to schedule or start now.';
    }, [recommendedTask]);

    const queueSections = useMemo(() => {
        const quickWins: Task[] = [];
        const nextHour: Task[] = [];
        const deepWork: Task[] = [];
        const blocked: Task[] = [];

        queueTasks.forEach(task => {
            if (isTaskBlocked(task)) {
                blocked.push(task);
                return;
            }

            const minutes = task.estimatedMinutes || 30;
            if (minutes <= 15) {
                quickWins.push(task);
                return;
            }

            if (minutes <= 60) {
                nextHour.push(task);
                return;
            }

            deepWork.push(task);
        });

        return [
            { id: 'quick', label: 'Quick wins', hint: '<= 15m', dotClass: 'bg-emerald-400', tasks: quickWins },
            { id: 'next', label: 'Next hour', hint: '16m - 60m', dotClass: 'bg-sky-400', tasks: nextHour },
            { id: 'deep', label: 'Deep work', hint: '60m+', dotClass: 'bg-violet-400', tasks: deepWork },
            { id: 'blocked', label: 'Blocked', hint: 'needs dependency', dotClass: 'bg-amber-400', tasks: blocked },
        ];
    }, [queueTasks]);

    const handleConfirmDeleteProject = async (projectId: string) => {
        onDeleteProject(projectId);
        setProjectToDelete(null);
        setProjectMenuOpenId(null);
    };

    return (
        <>
            <div
                className={`bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 flex flex-col
                    ${isOpen ? 'w-64' : 'w-16'}
                `}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    {isOpen ? (
                        <h1 
                            className="font-bold text-xl bg-clip-text text-transparent"
                            style={{
                                backgroundImage: `linear-gradient(to right, ${theme?.colors.primaryFrom || '#2563eb'}, ${theme?.colors.primaryTo || '#0891b2'})`
                            }}
                        >
                            Dopatika
                        </h1>
                    ) : (
                        <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{
                                backgroundImage: `linear-gradient(to bottom right, ${theme?.colors.primaryFrom || '#2563eb'}, ${theme?.colors.primaryTo || '#0891b2'})`
                            }}
                        >
                            F
                        </div>
                    )}
                    <button
                        onClick={onToggle}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {isOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-6">
                    {/* Inbox Section */}
                    <div>
                        {isOpen ? (
                            <div className="flex items-center gap-2 w-full px-2 py-1">
                                <ListTodo size={14} className="text-gray-400" />
                                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1 text-left">
                                    Inbox
                                </h2>
                                {visibleQueueCount > 0 && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                        {visibleQueueCount}
                                    </span>
                                )}
                            </div>
                        ) : (
                            queueCount > 0 && (
                                <div className="flex justify-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600" title="Inbox tasks">
                                        {queueCount}
                                    </div>
                                </div>
                            )
                        )}
                        {isOpen && (
                            <>
                                {/* Time Filter Buttons */}
                                <div className="mt-3 mb-3">
                                    <TimeFilterButtons
                                        activeFilter={timeFilter}
                                        onFilterChange={onTimeFilterChange}
                                        taskCounts={timeFilterCounts}
                                    />
                                </div>

                                {recommendedTask && (
                                    <div className="mb-3 px-2">
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                                            <div className="text-[9px] font-semibold uppercase tracking-wide text-blue-700">Start Here</div>
                                            <div className="text-xs font-medium text-gray-900 truncate mt-0.5">{recommendedTask.title}</div>
                                            <div className="text-[10px] text-blue-700 mt-0.5">{recommendationReason}</div>
                                            <button
                                                onClick={() => { void onStartNow(recommendedTask.id); }}
                                                className="mt-1.5 px-2 py-1 text-[10px] font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                            >
                                                Start now
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Task List */}
                                <div className="space-y-3">
                                    {queueSections
                                        .filter(section => section.tasks.length > 0)
                                        .map(section => (
                                            <div key={section.id} className="space-y-1">
                                                <div className="flex items-center justify-between px-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`h-2 w-2 rounded-full ${section.dotClass}`} />
                                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                                            {section.label}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] text-gray-400">{section.hint}</span>
                                                        <span className="text-[10px] text-gray-500">{section.tasks.length}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    {section.tasks.map(task => (
                                                        <CompactInboxTask
                                                            key={task.id}
                                                            task={task}
                                                            project={getProjectById(task.projectId)}
                                                            allProjects={projects}
                                                            isSelected={selectedTaskId === task.id}
                                                            onSelect={onSelectTask}
                                                            onStartDrag={onStartDrag}
                                                            onEdit={onEdit}
                                                            onDelete={onDelete}
                                                            onUpdate={onUpdate}
                                                            onStartNow={onStartNow}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    {queueTasks.length === 0 && (
                                        <div className="px-2 py-6 text-center">
                                            <p className="text-xs font-medium text-gray-500">Inbox is clear</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {timeFilter === null
                                                    ? 'Create a task to capture what is next.'
                                                    : `No inbox tasks fit ${timeFilter} minutes.`}
                                            </p>
                                            {timeFilter !== null && (
                                                <button
                                                    onClick={() => onTimeFilterChange(null)}
                                                    className="mt-2 px-2 py-1 text-[10px] font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                >
                                                    Clear duration filter
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Projects List */}
                    <div>
                        {isOpen ? (
                            <div className="flex items-center gap-1 mb-2">
                                <button
                                    onClick={() => setProjectsCollapsed(!projectsCollapsed)}
                                    className="flex items-center gap-2 flex-1 px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    {projectsCollapsed ? (
                                        <ChevronRight size={14} className="text-gray-400" />
                                    ) : (
                                        <ChevronDown size={14} className="text-gray-400" />
                                    )}
                                    <FolderKanban size={14} className="text-gray-400" />
                                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1 text-left">
                                        Projects
                                    </h2>
                                    {projects.length > 0 && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                            {projects.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={onCreateProject}
                                    className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                                    title="Create new project"
                                >
                                    <span className="text-lg font-bold leading-none">+</span>
                                </button>
                            </div>
                        ) : (
                            projects.length > 0 && (
                                <div className="flex justify-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-600" title="Projects">
                                        {projects.length}
                                    </div>
                                </div>
                            )
                        )}
                        {isOpen && !projectsCollapsed && (
                            <div className="space-y-0.5">
                                {projects.map(project => (
                                    <div key={project.id} className="group relative">
                                        <div
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ${
                                                selectedProjectId === project.id ? 'bg-purple-50 text-purple-700 font-medium' : ''
                                            }`}
                                            onClick={() => onSelectProject(project.id)}
                                        >
                                                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs" style={{ backgroundColor: project.color }}>
                                                    {projectIconMap[project.icon] || '📁'}
                                                </div>
                                                <span className="flex-1 text-left">{project.name}</span>
                                                {selectedProjectId === project.id && (
                                                    <span className="text-xs">✓</span>
                                                )}
                                                <button
                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setProjectMenuOpenId(projectMenuOpenId === project.id ? null : project.id);
                                                    }}
                                                    aria-label="Project options"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {projectMenuOpenId === project.id && (
                                                    <div className="absolute right-2 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-md w-32 py-1">
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdateProject(project.id, { name: project.name, color: project.color, icon: project.icon });
                                                                setProjectMenuOpenId(null);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setProjectToDelete(project.id);
                                                                setProjectMenuOpenId(null);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-3 border-t border-gray-100">
                    {isOpen && (
                        <p className="px-2 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            Workspace
                        </p>
                    )}
                    <Link
                        href="/analytics"
                        className={`flex items-center gap-2 w-full hover:bg-purple-50 p-2 rounded-lg transition-colors text-gray-600 hover:text-purple-600 ${
                            !isOpen && 'justify-center'
                        }`}
                        title="Insights"
                    >
                        <BarChart3 size={16} />
                        {isOpen && <span className="text-sm">Insights</span>}
                    </Link>
                    <Link
                        href="/settings"
                        className={`flex items-center gap-2 w-full hover:bg-gray-50 p-2 rounded-lg transition-colors text-gray-600 ${
                            !isOpen && 'justify-center'
                        }`}
                        title="Settings"
                    >
                        <Settings size={16} />
                        {isOpen && (
                            <span className="text-sm">
                                Settings{userName ? ` (${userName.split(' ')[0]})` : ''}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Delete Project Confirmation Modal */}
            {projectToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete project?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Deleting this project will move all its tasks to your Inbox. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setProjectToDelete(null)}
                                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConfirmDeleteProject(projectToDelete)}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
