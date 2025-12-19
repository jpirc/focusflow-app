/**
 * Sidebar Component - Project list, inbox, and finished tasks
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Menu, Settings, LogOut, MoreVertical, ChevronDown, ChevronUp, ChevronRight, Filter, Inbox, FolderKanban, CheckCircle2, PanelLeftClose, PanelLeft, Trash2, BarChart3 } from 'lucide-react';
import { Task, Project } from '@/types';
import { TaskCard } from '@/components/TaskCard';
import { CompactFinishedTask } from '@/components/CompactFinishedTask';

type FinishedFilter = 'all' | 'today' | 'week' | 'month';
type FinishedSort = 'completedAt' | 'title' | 'project';

interface SidebarProps {
    // State
    isOpen: boolean;
    onToggle: () => void;
    userName?: string | null;

    // Tasks
    tasks: Task[];
    inboxTasks: Task[];
    finishedTasks: Task[];
    selectedTaskId: string | null;
    onSelectTask: (id: string | null) => void;

    // Task handlers
    onStatusChange: (id: string, status: any) => void;
    onUncompleteToInbox: (id: string) => void;
    onClearFinished: (taskIds: string[]) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onStartDrag: (item: any) => void;
    onDelete: (id: string) => void;
    onAIBreakdown: (task: Task) => void;
    onUpdateSubtasks: (taskId: string, subtasks: any[]) => void;
    onEdit: (task: Task) => void;

    // Projects
    projects: Project[];
    selectedProjectId: string | null;
    onSelectProject: (id: string | null) => void;
    onCreateProject: () => void;
    onUpdateProject: (id: string, name: string) => Promise<boolean>;
    onDeleteProject: (id: string) => void;
    getProjectById: (id: string | undefined) => Project;
}

export function Sidebar({
    isOpen,
    onToggle,
    userName,
    tasks,
    inboxTasks,
    finishedTasks,
    selectedTaskId,
    onSelectTask,
    onStatusChange,
    onUncompleteToInbox,
    onClearFinished,
    onToggleSubtask,
    onStartDrag,
    onDelete,
    onAIBreakdown,
    onUpdateSubtasks,
    onEdit,
    projects,
    selectedProjectId,
    onSelectProject,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    getProjectById,
}: SidebarProps) {
    // Project editing state
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingProjectName, setEditingProjectName] = useState('');
    const [projectMenuOpenId, setProjectMenuOpenId] = useState<string | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    // Collapsible section state
    const [inboxCollapsed, setInboxCollapsed] = useState(false);
    const [projectsCollapsed, setProjectsCollapsed] = useState(false);
    const [finishedCollapsed, setFinishedCollapsed] = useState(false);

    // Finished tasks state
    const [finishedExpanded, setFinishedExpanded] = useState(false);
    const [finishedFilter, setFinishedFilter] = useState<FinishedFilter>('all');
    const [showFinishedFilterMenu, setShowFinishedFilterMenu] = useState(false);
    const VISIBLE_FINISHED_COUNT = 5;

    // Filter and sort finished tasks
    const sortedFinishedTasks = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

        let filtered = [...finishedTasks];

        // Apply filter
        if (finishedFilter !== 'all') {
            filtered = filtered.filter(task => {
                if (!task.completedAt) return false;
                const completedDate = new Date(task.completedAt);
                switch (finishedFilter) {
                    case 'today':
                        return completedDate >= todayStart;
                    case 'week':
                        return completedDate >= weekAgo;
                    case 'month':
                        return completedDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Sort by completedAt (newest first)
        filtered.sort((a, b) => {
            const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return dateB - dateA;
        });

        return filtered;
    }, [finishedTasks, finishedFilter]);

    const visibleFinishedTasks = finishedExpanded 
        ? sortedFinishedTasks 
        : sortedFinishedTasks.slice(0, VISIBLE_FINISHED_COUNT);
    const hiddenCount = sortedFinishedTasks.length - VISIBLE_FINISHED_COUNT;

    const handleUncomplete = (taskId: string) => {
        onUncompleteToInbox(taskId);
    };

    const handleStartEditProject = (project: Project) => {
        setEditingProjectId(project.id);
        setEditingProjectName(project.name);
        setProjectMenuOpenId(null);
    };

    const handleCancelEditProject = () => {
        setEditingProjectId(null);
        setEditingProjectName('');
    };

    const handleSaveProjectName = async (projectId: string) => {
        const trimmed = editingProjectName.trim();
        if (!trimmed) {
            handleCancelEditProject();
            return;
        }

        const success = await onUpdateProject(projectId, trimmed);
        if (success) {
            handleCancelEditProject();
        }
    };

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
                        <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            FocusFlow
                        </h1>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
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
                            <button
                                onClick={() => setInboxCollapsed(!inboxCollapsed)}
                                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                                {inboxCollapsed ? (
                                    <ChevronRight size={14} className="text-gray-400" />
                                ) : (
                                    <ChevronDown size={14} className="text-gray-400" />
                                )}
                                <Inbox size={14} className="text-gray-400" />
                                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1 text-left">
                                    Inbox
                                </h2>
                                {inboxTasks.length > 0 && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                        {inboxTasks.length}
                                    </span>
                                )}
                            </button>
                        ) : (
                            inboxTasks.length > 0 && (
                                <div className="flex justify-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600" title="Inbox tasks">
                                        {inboxTasks.length}
                                    </div>
                                </div>
                            )
                        )}
                        {isOpen && !inboxCollapsed && (
                            <div className="space-y-2 mt-2">
                                {inboxTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        project={getProjectById(task.projectId)}
                                        allTasks={tasks}
                                        isSelected={selectedTaskId === task.id}
                                        onSelect={onSelectTask}
                                        onStatusChange={onStatusChange}
                                        onToggleSubtask={onToggleSubtask}
                                        onStartDrag={onStartDrag}
                                        onDelete={onDelete}
                                        onAIBreakdown={onAIBreakdown}
                                        onUpdateSubtasks={onUpdateSubtasks}
                                        onEdit={onEdit}
                                    />
                                ))}
                            </div>
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
                            <div className="space-y-1">
                                {projects.map(project => (
                                    <div key={project.id} className="group relative">
                                        {editingProjectId === project.id ? (
                                            <div className="flex items-center gap-2 px-2 py-2 bg-white rounded-lg border border-gray-200">
                                                <input
                                                    type="text"
                                                    value={editingProjectName}
                                                    onChange={(e) => setEditingProjectName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveProjectName(project.id);
                                                        if (e.key === 'Escape') handleCancelEditProject();
                                                    }}
                                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleSaveProjectName(project.id)}
                                                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEditProject}
                                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className={`w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ${
                                                    selectedProjectId === project.id ? 'bg-purple-50 text-purple-700 font-medium' : ''
                                                }`}
                                                onClick={() => onSelectProject(project.id)}
                                            >
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
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
                                                                handleStartEditProject(project);
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
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Finished Section */}
                    <div>
                        {isOpen ? (
                            <div className="flex items-center gap-1 mb-2">
                                <button
                                    onClick={() => setFinishedCollapsed(!finishedCollapsed)}
                                    className="flex items-center gap-2 flex-1 px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    {finishedCollapsed ? (
                                        <ChevronRight size={14} className="text-gray-400" />
                                    ) : (
                                        <ChevronDown size={14} className="text-gray-400" />
                                    )}
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1 text-left">
                                        Finished
                                    </h2>
                                    {sortedFinishedTasks.length > 0 && (
                                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                                            {sortedFinishedTasks.length}
                                        </span>
                                    )}
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFinishedFilterMenu(!showFinishedFilterMenu)}
                                        className={`p-1 hover:bg-gray-100 rounded transition-colors ${
                                            finishedFilter !== 'all' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                        title="Filter"
                                    >
                                        <Filter size={12} />
                                    </button>
                                    {showFinishedFilterMenu && (
                                        <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-lg shadow-md w-28 py-1">
                                            {(['all', 'today', 'week', 'month'] as FinishedFilter[]).map(filter => (
                                                <button
                                                    key={filter}
                                                    onClick={() => {
                                                        setFinishedFilter(filter);
                                                        setShowFinishedFilterMenu(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-xs capitalize ${
                                                        finishedFilter === filter
                                                            ? 'bg-purple-50 text-purple-600 font-medium'
                                                            : 'hover:bg-gray-50 text-gray-600'
                                                    }`}
                                                >
                                                    {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : `This ${filter}`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Clear all finished tasks button */}
                                {sortedFinishedTasks.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete all ${sortedFinishedTasks.length} finished tasks? This cannot be undone.`)) {
                                                onClearFinished(sortedFinishedTasks.map(t => t.id));
                                            }
                                        }}
                                        className="p-1 hover:bg-red-50 rounded transition-colors text-gray-400 hover:text-red-500"
                                        title="Clear all finished tasks"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            finishedTasks.length > 0 && (
                                <div className="flex justify-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-600" title="Finished tasks">
                                        {finishedTasks.length}
                                    </div>
                                </div>
                            )
                        )}
                        {isOpen && !finishedCollapsed && (
                            <div className="space-y-0.5">
                                {visibleFinishedTasks.map(task => (
                                    <CompactFinishedTask
                                        key={task.id}
                                        task={task}
                                        project={getProjectById(task.projectId)}
                                        onUncomplete={handleUncomplete}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                                {/* Show more/less toggle */}
                                {hiddenCount > 0 && (
                                    <button
                                        onClick={() => setFinishedExpanded(!finishedExpanded)}
                                        className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                    >
                                        {finishedExpanded ? (
                                            <>
                                                <ChevronUp size={12} />
                                                Show less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={12} />
                                                Show {hiddenCount} more
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {/* Analytics Link */}
                    <Link
                        href="/analytics"
                        className={`flex items-center gap-3 w-full hover:bg-purple-50 p-2 rounded-lg transition-colors text-gray-600 hover:text-purple-600 ${
                            !isOpen && 'justify-center'
                        }`}
                    >
                        <BarChart3 size={18} />
                        {isOpen && <span className="flex-1 text-left text-sm">Analytics & Insights</span>}
                    </Link>
                    <Link
                        href="/settings"
                        className={`flex items-center gap-3 w-full hover:bg-gray-50 p-2 rounded-lg transition-colors ${
                            !isOpen && 'justify-center'
                        }`}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-white font-medium text-sm">
                            {userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {isOpen && (
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-700">{userName || 'User'}</p>
                                <p className="text-xs text-gray-400">Account</p>
                            </div>
                        )}
                        {isOpen && <Settings size={16} className="text-gray-400" />}
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className={`flex items-center gap-3 w-full hover:bg-gray-50 p-2 rounded-lg transition-colors text-gray-600 ${
                            !isOpen && 'justify-center'
                        }`}
                    >
                        <LogOut size={18} />
                        {isOpen && <span className="flex-1 text-left text-sm">Sign out</span>}
                    </button>
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
