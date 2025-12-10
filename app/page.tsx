'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Clock, Plus, ChevronLeft, ChevronRight,
  Calendar, Settings, User, LogOut,
  Volume2, VolumeX, Moon, Menu, Brain,
  Sunrise, Sun, Sunset
} from 'lucide-react';
import { Task, Project, Subtask, TaskStatus, TimeBlock, DragItem, TimeBlockConfig } from '../types';
import { TaskCard } from '../components/TaskCard';
import { TimeBlockColumn } from '../components/TimeBlockColumn';
import { AIBreakdownModal } from '../components/AIBreakdownModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { useSession } from 'next-auth/react';

// ============================================
// CONSTANTS
// ============================================

const TIME_BLOCKS: TimeBlockConfig[] = [
  { id: 'anytime', label: 'Anytime', icon: <Clock size={16} />, hours: 'Flexible', energyMatch: 'medium' },
  { id: 'morning', label: 'Morning', icon: <Sunrise size={16} />, hours: '6 AM - 12 PM', energyMatch: 'high' },
  { id: 'afternoon', label: 'Afternoon', icon: <Sun size={16} />, hours: '12 PM - 5 PM', energyMatch: 'medium' },
  { id: 'evening', label: 'Evening', icon: <Sunset size={16} />, hours: '5 PM - 10 PM', energyMatch: 'low' },
];



// ============================================
// UTILITIES
// ============================================

const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = addDays(today, 1);
  if (dateStr === formatDate(today)) return 'Today';
  if (dateStr === formatDate(tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const isToday = (dateStr: string): boolean => dateStr === formatDate(new Date());

// ============================================
// SAMPLE DATA
// ============================================

const createSampleTasks = (): Task[] => {
  const today = formatDate(new Date());
  const tomorrow = formatDate(addDays(new Date(), 1));
  const dayAfter = formatDate(addDays(new Date(), 2));

  return [
    {
      id: 't1', title: 'Morning Standup', description: 'Daily team sync', projectId: 'work',
      date: today, timeBlock: 'morning', estimatedMinutes: 30, status: 'completed',
      priority: 'medium', energyLevel: 'medium', icon: 'briefcase',
      subtasks: [], dependsOn: [], dependents: ['t2'], createdAt: new Date().toISOString()
    },
    {
      id: 't2', title: 'Q4 Planning Document', description: 'Draft the quarterly objectives', projectId: 'work',
      date: today, timeBlock: 'morning', estimatedMinutes: 120, status: 'in-progress',
      priority: 'high', energyLevel: 'high', icon: 'briefcase',
      subtasks: [
        { id: 's1', title: 'Review Q3 metrics', completed: true, estimatedMinutes: 30 },
        { id: 's2', title: 'Draft objectives', completed: false, estimatedMinutes: 45 },
        { id: 's3', title: 'Get stakeholder input', completed: false, estimatedMinutes: 30 },
      ],
      dependsOn: ['t1'], dependents: ['t5'], createdAt: new Date().toISOString()
    },
    {
      id: 't3', title: 'Gym - Upper Body', description: 'Chest, shoulders, triceps', projectId: 'health',
      date: today, timeBlock: 'afternoon', estimatedMinutes: 60, status: 'pending',
      priority: 'medium', energyLevel: 'high', icon: 'dumbbell',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't4', title: 'Read AI Research Paper', projectId: 'learning',
      date: today, timeBlock: 'evening', estimatedMinutes: 45, status: 'pending',
      priority: 'low', energyLevel: 'low', icon: 'book',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't5', title: 'Present Q4 Plan', description: 'Leadership review meeting', projectId: 'work',
      date: tomorrow, timeBlock: 'morning', estimatedMinutes: 60, status: 'pending',
      priority: 'urgent', energyLevel: 'high', icon: 'briefcase',
      subtasks: [], dependsOn: ['t2'], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't6', title: 'Dentist Appointment', projectId: 'personal',
      date: tomorrow, timeBlock: 'afternoon', estimatedMinutes: 60, status: 'pending',
      priority: 'high', energyLevel: 'low', icon: 'heart',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't7', title: 'Online Course Module 3', description: 'React Advanced Patterns', projectId: 'learning',
      date: tomorrow, timeBlock: 'evening', estimatedMinutes: 90, status: 'pending',
      priority: 'medium', energyLevel: 'medium', icon: 'book',
      subtasks: [
        { id: 's4', title: 'Watch lecture videos', completed: false, estimatedMinutes: 45 },
        { id: 's5', title: 'Complete exercises', completed: false, estimatedMinutes: 45 },
      ],
      dependsOn: [], dependents: ['t9'], createdAt: new Date().toISOString()
    },
    {
      id: 't8', title: 'Grocery Shopping', projectId: 'home',
      date: dayAfter, timeBlock: 'morning', estimatedMinutes: 45, status: 'pending',
      priority: 'medium', energyLevel: 'medium', icon: 'home',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't9', title: 'Course Quiz', description: 'Module 3 assessment', projectId: 'learning',
      date: dayAfter, timeBlock: 'afternoon', estimatedMinutes: 30, status: 'pending',
      priority: 'high', energyLevel: 'high', icon: 'book',
      subtasks: [], dependsOn: ['t7'], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't10', title: 'Research vacation destinations', projectId: 'personal',
      date: null, timeBlock: 'anytime', estimatedMinutes: 30, status: 'pending',
      priority: 'low', energyLevel: 'low', icon: 'heart',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
    {
      id: 't11', title: 'Update LinkedIn profile', projectId: 'work',
      date: null, timeBlock: 'anytime', estimatedMinutes: 20, status: 'pending',
      priority: 'low', energyLevel: 'low', icon: 'briefcase',
      subtasks: [], dependsOn: [], dependents: [], createdAt: new Date().toISOString()
    },
  ];
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function FocusFlowApp() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewDays, setViewDays] = useState(3);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [taskForAI, setTaskForAI] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  // Initialize - fetch tasks from API
  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, [session, fetchTasks, fetchProjects]);

  // Handlers
  const handleCreateTask = useCallback(async (
    title: string,
    description: string,
    date: string | null,
    timeBlock: TimeBlock,
    projectId?: string
  ) => {
    if (!session) {
      // Offline mode - just add to local state
      const newTask: Task = {
        id: `t_${Date.now()}`,
        title,
        description,
        projectId,
        date,
        timeBlock,
        status: 'pending',
        priority: 'medium',
        energyLevel: 'medium',
        estimatedMinutes: 30,
        icon: 'target',
        subtasks: [],
        dependsOn: [],
        dependents: [],
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, newTask]);
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, date, timeBlock, projectId }),
      });
      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  }, [session]);

  const handleStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

    if (!session) return;

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      fetchTasks(); // Revert on error
    }
  }, [session, fetchTasks]);



  const handleStartDrag = useCallback((item: DragItem) => {
    // Could store drag state here if needed
    console.log('Dragging', item);
  }, []);

  const handleDrop = useCallback(async (taskId: string, targetDate: string, targetBlock: TimeBlock) => {
    // Optimistic update
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, date: targetDate, timeBlock: targetBlock };
    }));

    if (!session) return;

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: targetDate, timeBlock: targetBlock }),
      });
    } catch (error) {
      console.error('Failed to update task position:', error);
      fetchTasks(); // Revert on error
    }
  }, [session, fetchTasks]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    if (!session) {
      alert('You must be logged in to delete tasks');
      return;
    }

    // Store current state for rollback
    const deletedTask = tasks.find(t => t.id === id);
    
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);
    if (taskToEdit?.id === id) setTaskToEdit(null);

    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Rollback on error
      if (deletedTask) {
        setTasks(prev => [...prev, deletedTask]);
      }
      alert('Failed to delete task. Please try again.');
    }
  }, [tasks, selectedTaskId, taskToEdit?.id, session]);

  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  }, []);

  const handleUpdateTask = useCallback(async (
    id: string,
    updates: Partial<Task>
  ) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (!session) return;

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      fetchTasks(); // Revert on error
    }
  }, [session, fetchTasks]);

  const handleAIBreakdown = useCallback((task: Task) => {
    setTaskForAI(task);
    setAiModalOpen(true);
  }, []);

  const handleApplyAIBreakdown = useCallback((subtasks: Subtask[]) => {
    if (taskForAI) {
      setTasks(prev => prev.map(t =>
        t.id === taskForAI.id ? { ...t, subtasks: [...t.subtasks, ...subtasks], aiGenerated: true } : t
      ));
    }
  }, [taskForAI]);

  const handleUpdateSubtasks = useCallback((taskId: string, subtasks: Subtask[]) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, subtasks } : t
    ));
  }, []);

  const handleCreateProject = useCallback(async (
    name: string,
    color: string,
    icon: string
  ) => {
    if (!session) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, icon }),
      });
      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [...prev, newProject]);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  }, [session]);

  // Subtask handlers
  const handleAddSubtask = useCallback(async (taskId: string, title: string, estimatedMinutes: number = 15) => {
    if (!session) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          parentTaskId: taskId,
          timeBlock: 'anytime',
          estimatedMinutes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both direct response and wrapped response
        const newSubtask = data.data || data;
        
        // Ensure subtask has all required fields
        const completeSubtask = {
          ...newSubtask,
          completed: newSubtask.completed || false,
          estimatedMinutes: newSubtask.estimatedMinutes || estimatedMinutes,
        };

        // Update tasks immediately for instant UI feedback
        setTasks(prev => prev.map(t =>
          t.id === taskId 
            ? { ...t, subtasks: [...(t.subtasks || []), completeSubtask] } 
            : t
        ));
        
        // Also update taskToEdit if it's the same task
        if (taskToEdit?.id === taskId) {
          setTaskToEdit(prev => prev ? { ...prev, subtasks: [...(prev.subtasks || []), completeSubtask] } : prev);
        }
      } else {
        const error = await response.json();
        console.error('Failed to add subtask:', error);
        alert('Failed to add subtask. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
      alert('Failed to add subtask. Please try again.');
    }
  }, [session, taskToEdit?.id]);

  const handleToggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    // Find the subtask to toggle
    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks?.find((s: any) => s.id === subtaskId);
    if (!subtask) return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? {
          ...t,
          subtasks: t.subtasks?.map((s: any) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          ),
        }
        : t
    ));
    // Also update taskToEdit if it's the same task
    if (taskToEdit?.id === taskId) {
      setTaskToEdit(prev => prev ? {
        ...prev,
        subtasks: prev.subtasks?.map((s: any) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      } : prev);
    }

    if (!session) return;

    try {
      await fetch(`/api/tasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed }),
      });
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
      fetchTasks(); // Revert on error
    }
  }, [tasks, session, fetchTasks]);

  const handleDeleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks?.filter((s: any) => s.id !== subtaskId) }
        : t
    ));
    // Also update taskToEdit if it's the same task
    if (taskToEdit?.id === taskId) {
      setTaskToEdit(prev => prev ? {
        ...prev,
        subtasks: prev.subtasks?.filter((s: any) => s.id !== subtaskId),
      } : prev);
    }

    if (!session) return;

    try {
      await fetch(`/api/tasks/${subtaskId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      fetchTasks(); // Revert on error
    }
  }, [session, fetchTasks]);

  const handleUpdateSubtask = useCallback(async (taskId: string, subtaskId: string, updates: { estimatedMinutes?: number; title?: string; completed?: boolean }) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? {
          ...t,
          subtasks: t.subtasks?.map((s: any) =>
            s.id === subtaskId ? { ...s, ...updates } : s
          ),
        }
        : t
    ));
    
    // Also update taskToEdit if it's the same task
    if (taskToEdit?.id === taskId) {
      setTaskToEdit(prev => prev ? {
        ...prev,
        subtasks: prev.subtasks?.map((s: any) =>
          s.id === subtaskId ? { ...s, ...updates } : s
        ),
      } : prev);
    }

    if (!session) return;

    try {
      await fetch(`/api/tasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update subtask:', error);
      fetchTasks(); // Revert on error
    }
  }, [session, taskToEdit?.id, fetchTasks]);

  // Dependency handlers
  const handleAddDependency = useCallback(async (taskId: string, dependsOnId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependsOnId }),
      });

      if (response.ok) {
        const newDependency = await response.json();
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, dependencies: [...(t.dependencies || []), newDependency] }
            : t
        ));
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add dependency');
      }
    } catch (error) {
      console.error('Failed to add dependency:', error);
      alert('Failed to add dependency. Please try again.');
    }
  }, [session]);

  const handleRemoveDependency = useCallback(async (taskId: string, dependencyId: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, dependencies: t.dependencies?.filter((d: any) => d.id !== dependencyId) }
        : t
    ));

    if (!session) return;

    try {
      await fetch(`/api/tasks/${taskId}/dependencies/${dependencyId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to remove dependency:', error);
      fetchTasks(); // Revert on error
    }
  }, [session, fetchTasks]);

  // Filter tasks for inbox (no date), finished, and by selected project
  const inboxTasks = tasks.filter(t =>
    !t.date && t.status !== 'completed' && (!selectedProjectId || t.projectId === selectedProjectId)
  );

  const finishedTasks = tasks.filter(t =>
    t.status === 'completed' && (!selectedProjectId || t.projectId === selectedProjectId)
  );

  // Auth protection: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      window.location.href = '/login';
    }
  }, [session, loading]);

  // Generate days to display (excluding completed tasks)
  const displayDays = Array.from({ length: viewDays }, (_, i) => {
    const date = addDays(currentDate, i);
    const dateStr = formatDate(date);
    // Filter by selected project if one is selected, excluding completed tasks
    const dayTasks = tasks.filter(t =>
      formatDate(t.date!) === dateStr && t.status !== 'completed' && (!selectedProjectId || t.projectId === selectedProjectId)
    );
    return {
      date: date,
      dateStr: dateStr,
      display: formatDisplayDate(dateStr),
      isToday: isToday(dateStr),
      tasks: dayTasks
    };
  });

  // Show loading state while checking auth
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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          {sidebarOpen ? (
            <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              FocusFlow
            </h1>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              F
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Inbox Section */}
          <div>
            {sidebarOpen && (
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                Inbox ({inboxTasks.length})
              </h2>
            )}
            <div className="space-y-2">
              {inboxTasks.map(task => (
                <div key={task.id} className={sidebarOpen ? '' : 'hidden'}>
                  <TaskCard
                    task={task}
                    project={projects.find((p: any) => p.id === task.projectId) || { id: 'default', name: 'No Project', color: '#6b7280', bgColor: '#f3f4f6', icon: 'folder' }}
                    allTasks={tasks}
                    isSelected={selectedTaskId === task.id}
                    onSelect={setSelectedTaskId}
                    onStatusChange={handleStatusChange}
                    onToggleSubtask={handleToggleSubtask}
                    onStartDrag={handleStartDrag}
                    onDelete={handleDelete}
                    onAIBreakdown={handleAIBreakdown}
                    onUpdateSubtasks={handleUpdateSubtasks}
                    onEdit={handleEditTask}
                  />
                </div>
              ))}
              {!sidebarOpen && inboxTasks.length > 0 && (
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                    {inboxTasks.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Projects List */}
          {sidebarOpen && (
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Projects
                </h2>
                <button
                  onClick={() => setCreateProjectModalOpen(true)}
                  className="text-purple-600 hover:text-purple-700 text-lg font-bold"
                  title="Create new project"
                >
                  +
                </button>
              </div>
              <div className="space-y-1">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(selectedProjectId === project.id ? null : project.id)}
                    className={`w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${selectedProjectId === project.id ? 'bg-purple-50 text-purple-700 font-medium' : ''
                      }`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <span>{project.name}</span>
                    {selectedProjectId === project.id && (
                      <span className="ml-auto text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Finished Section */}
          <div>
            {sidebarOpen && (
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                Finished ({finishedTasks.length})
              </h2>
            )}
            <div className="space-y-2">
              {finishedTasks.map(task => (
                <div key={task.id} className={sidebarOpen ? '' : 'hidden'}>
                  <TaskCard
                    task={task}
                    project={projects.find((p: any) => p.id === task.projectId) || { id: 'default', name: 'No Project', color: '#6b7280', bgColor: '#f3f4f6', icon: 'folder' }}
                    allTasks={tasks}
                    isSelected={selectedTaskId === task.id}
                    onSelect={setSelectedTaskId}
                    onStatusChange={handleStatusChange}
                    onToggleSubtask={handleToggleSubtask}
                    onStartDrag={handleStartDrag}
                    onDelete={handleDelete}
                    onAIBreakdown={handleAIBreakdown}
                    onUpdateSubtasks={handleUpdateSubtasks}
                    onEdit={handleEditTask}
                  />
                </div>
              ))}
              {!sidebarOpen && finishedTasks.length > 0 && (
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-600">
                    {finishedTasks.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link href="/settings" className={`flex items-center gap-3 w-full hover:bg-gray-50 p-2 rounded-lg transition-colors ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-white font-medium text-sm">
              JP
            </div>
            {sidebarOpen && (
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-700">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">Account</p>
              </div>
            )}
            {sidebarOpen && <Settings size={16} className="text-gray-400" />}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`flex items-center gap-3 w-full hover:bg-gray-50 p-2 rounded-lg transition-colors text-gray-600 ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="flex-1 text-left text-sm">Sign out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentDate(addDays(currentDate, -1))}
                className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:shadow text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white rounded-md transition-all"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 1))}
                className="p-1.5 hover:bg-white rounded-md transition-all shadow-sm hover:shadow text-gray-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={20} className="text-purple-500" />
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {[2, 3, 5].map(days => (
                <button
                  key={days}
                  onClick={() => setViewDays(days)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewDays === days
                    ? 'bg-white shadow text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm hover:shadow"
            >
              <Plus size={18} />
              New Task
            </button>
          </div>
        </header>

        {/* Timeline View */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <div className="flex gap-6 min-w-max h-full">
            {displayDays.map(day => (
              <div key={day.dateStr} className="w-80 flex-shrink-0 flex flex-col h-full">
                {/* Day Header */}
                <div className={`mb-4 flex items-center justify-between ${day.isToday ? 'text-purple-600' : 'text-gray-500'}`}>
                  <div>
                    <h3 className="font-bold text-lg">{day.display}</h3>
                    <p className="text-xs opacity-70">{day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                  {day.isToday && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Time Blocks */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-10">
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
                      onStatusChange={handleStatusChange}
                      onToggleSubtask={handleToggleSubtask}
                      onStartDrag={handleStartDrag}
                      onDrop={handleDrop}
                      onDelete={handleDelete}
                      onAIBreakdown={handleAIBreakdown}
                      onUpdateSubtasks={handleUpdateSubtasks}
                      onEdit={handleEditTask}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {taskForAI && (
        <AIBreakdownModal
          task={taskForAI}
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onApply={handleApplyAIBreakdown}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateTask}
        defaultDate={formatDate(currentDate)}
        projects={projects}
      />

      {/* Edit Task Modal */}
      {taskToEdit && (
        <EditTaskModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setTaskToEdit(null);
          }}
          onUpdate={handleUpdateTask}
          task={taskToEdit}
          projects={projects}
          allTasks={tasks}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onAddDependency={handleAddDependency}
          onRemoveDependency={handleRemoveDependency}
        />
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
