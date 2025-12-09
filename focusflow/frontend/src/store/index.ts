import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Project, TimeBlock, DragItem, Action, UserPreferences } from '../types';
import { DEFAULT_PROJECTS } from '../types';
import { taskApi, projectApi, historyApi } from '../api';
import { addDays, format } from 'date-fns';

// ============================================
// APP STORE
// ============================================

interface AppState {
  // UI State
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  draggedItem: DragItem | null;
  startDate: Date;
  visibleDays: number;
  showQuickAdd: boolean;
  showBreakdownModal: boolean;
  breakdownTaskId: string | null;
  isLoading: boolean;
  error: string | null;

  // Data
  tasks: Task[];
  projects: Project[];
  
  // Action History (for undo/redo)
  actionHistory: Action[];
  redoStack: Action[];

  // User Preferences
  preferences: UserPreferences;

  // Actions - UI
  setSelectedTask: (id: string | null) => void;
  setSelectedProject: (id: string | null) => void;
  setDraggedItem: (item: DragItem | null) => void;
  setStartDate: (date: Date) => void;
  navigateDays: (direction: number) => void;
  goToToday: () => void;
  setVisibleDays: (days: number) => void;
  toggleQuickAdd: () => void;
  openBreakdownModal: (taskId: string) => void;
  closeBreakdownModal: () => void;

  // Actions - Data
  fetchTasks: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, targetDate: string | null, targetTimeBlock: TimeBlock) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  linkTasks: (parentId: string, dependentId: string) => Promise<void>;
  unlinkTasks: (parentId: string, dependentId: string) => Promise<void>;
  applyBreakdown: (taskId: string, subtasks: { title: string; estimatedMinutes: number }[]) => Promise<void>;

  // Actions - History
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  recordAction: (action: Omit<Action, 'id' | 'timestamp'>) => void;

  // Actions - Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial UI State
      selectedTaskId: null,
      selectedProjectId: null,
      draggedItem: null,
      startDate: new Date(),
      visibleDays: 3,
      showQuickAdd: false,
      showBreakdownModal: false,
      breakdownTaskId: null,
      isLoading: false,
      error: null,

      // Initial Data
      tasks: [],
      projects: DEFAULT_PROJECTS,

      // Action History
      actionHistory: [],
      redoStack: [],

      // Preferences
      preferences: {
        theme: 'light',
        defaultTaskDuration: 30,
        morningStart: '06:00',
        afternoonStart: '12:00',
        eveningStart: '17:00',
        highEnergyTime: 'morning',
        enableSounds: true,
        enableAnimations: true,
      },

      // ============================================
      // UI ACTIONS
      // ============================================

      setSelectedTask: (id) => set({ selectedTaskId: id }),
      
      setSelectedProject: (id) => set({ selectedProjectId: id }),
      
      setDraggedItem: (item) => set({ draggedItem: item }),
      
      setStartDate: (date) => set({ startDate: date }),
      
      navigateDays: (direction) => set((state) => ({
        startDate: addDays(state.startDate, direction),
      })),
      
      goToToday: () => set({ startDate: new Date() }),
      
      setVisibleDays: (days) => set({ visibleDays: days }),
      
      toggleQuickAdd: () => set((state) => ({ showQuickAdd: !state.showQuickAdd })),
      
      openBreakdownModal: (taskId) => set({ 
        showBreakdownModal: true, 
        breakdownTaskId: taskId 
      }),
      
      closeBreakdownModal: () => set({ 
        showBreakdownModal: false, 
        breakdownTaskId: null 
      }),

      // ============================================
      // DATA ACTIONS
      // ============================================

      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await taskApi.getAll({ includeInbox: true });
          set({ tasks, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch tasks', isLoading: false });
          console.error('Fetch tasks error:', error);
        }
      },

      fetchProjects: async () => {
        try {
          const projects = await projectApi.getAll();
          set({ projects });
        } catch (error) {
          console.error('Fetch projects error:', error);
        }
      },

      addTask: async (taskData) => {
        set({ isLoading: true });
        try {
          const newTask = await taskApi.create(taskData);
          set((state) => ({
            tasks: [...state.tasks, newTask],
            isLoading: false,
            showQuickAdd: false,
          }));
          
          get().recordAction({
            type: 'create',
            taskId: newTask.id,
            newState: newTask,
          });
          
          return newTask;
        } catch (error) {
          set({ error: 'Failed to create task', isLoading: false });
          throw error;
        }
      },

      updateTask: async (id, updates) => {
        const previousTask = get().tasks.find((t) => t.id === id);
        
        // Optimistic update
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));

        try {
          await taskApi.update(id, updates);
          
          if (previousTask) {
            get().recordAction({
              type: 'update',
              taskId: id,
              previousState: previousTask,
              newState: { ...previousTask, ...updates },
            });
          }
        } catch (error) {
          // Revert on error
          if (previousTask) {
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === id ? previousTask : t)),
              error: 'Failed to update task',
            }));
          }
          throw error;
        }
      },

      deleteTask: async (id) => {
        const previousTask = get().tasks.find((t) => t.id === id);
        
        // Optimistic delete
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        }));

        try {
          await taskApi.delete(id);
          
          if (previousTask) {
            get().recordAction({
              type: 'delete',
              taskId: id,
              previousState: previousTask,
            });
          }
        } catch (error) {
          // Revert on error
          if (previousTask) {
            set((state) => ({
              tasks: [...state.tasks, previousTask],
              error: 'Failed to delete task',
            }));
          }
          throw error;
        }
      },

      moveTask: async (taskId, targetDate, targetTimeBlock) => {
        const previousTask = get().tasks.find((t) => t.id === taskId);
        
        // Optimistic update
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, date: targetDate, timeBlock: targetTimeBlock, updatedAt: new Date().toISOString() }
              : t
          ),
          draggedItem: null,
        }));

        try {
          await taskApi.move(taskId, targetDate, targetTimeBlock);
          
          if (previousTask) {
            get().recordAction({
              type: 'move',
              taskId,
              previousState: { date: previousTask.date, timeBlock: previousTask.timeBlock },
              newState: { date: targetDate, timeBlock: targetTimeBlock },
            });
          }
        } catch (error) {
          // Revert on error
          if (previousTask) {
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === taskId ? previousTask : t
              ),
              error: 'Failed to move task',
            }));
          }
          throw error;
        }
      },

      completeTask: async (id) => {
        await get().updateTask(id, { status: 'completed' });
      },

      startTask: async (id) => {
        // Stop any currently in-progress tasks
        const currentlyActive = get().tasks.find((t) => t.status === 'in-progress');
        if (currentlyActive && currentlyActive.id !== id) {
          await get().updateTask(currentlyActive.id, { status: 'pending' });
        }
        await get().updateTask(id, { status: 'in-progress' });
      },

      toggleSubtask: async (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = task.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );

        await get().updateTask(taskId, { subtasks: updatedSubtasks });
      },

      linkTasks: async (parentId, dependentId) => {
        try {
          await taskApi.link(parentId, dependentId);
          
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id === dependentId) {
                return { ...t, dependsOn: [...t.dependsOn, parentId] };
              }
              if (t.id === parentId) {
                return { ...t, dependents: [...t.dependents, dependentId] };
              }
              return t;
            }),
          }));
        } catch (error) {
          set({ error: 'Failed to link tasks' });
          throw error;
        }
      },

      unlinkTasks: async (parentId, dependentId) => {
        try {
          await taskApi.unlink(parentId, dependentId);
          
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id === dependentId) {
                return { ...t, dependsOn: t.dependsOn.filter((id) => id !== parentId) };
              }
              if (t.id === parentId) {
                return { ...t, dependents: t.dependents.filter((id) => id !== dependentId) };
              }
              return t;
            }),
          }));
        } catch (error) {
          set({ error: 'Failed to unlink tasks' });
          throw error;
        }
      },

      applyBreakdown: async (taskId, subtasks) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newSubtasks = subtasks.map((st, index) => ({
          id: `${taskId}-sub-${index}-${Date.now()}`,
          title: st.title,
          completed: false,
        }));

        const totalEstimate = subtasks.reduce((sum, st) => sum + st.estimatedMinutes, 0);

        await get().updateTask(taskId, {
          subtasks: [...task.subtasks, ...newSubtasks],
          estimatedMinutes: Math.max(task.estimatedMinutes, totalEstimate),
        });

        get().closeBreakdownModal();
      },

      // ============================================
      // HISTORY ACTIONS (UNDO/REDO)
      // ============================================

      recordAction: (action) => {
        const fullAction: Action = {
          ...action,
          id: `action-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          actionHistory: [...state.actionHistory.slice(-49), fullAction], // Keep last 50
          redoStack: [], // Clear redo stack on new action
        }));
      },

      undo: async () => {
        const { actionHistory } = get();
        if (actionHistory.length === 0) return;

        const lastAction = actionHistory[actionHistory.length - 1];
        
        try {
          // Perform undo based on action type
          switch (lastAction.type) {
            case 'create':
              // Delete the created task
              set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== lastAction.taskId),
              }));
              break;
            case 'delete':
              // Restore the deleted task
              if (lastAction.previousState) {
                set((state) => ({
                  tasks: [...state.tasks, lastAction.previousState as Task],
                }));
              }
              break;
            case 'update':
            case 'move':
              // Restore previous state
              if (lastAction.previousState) {
                set((state) => ({
                  tasks: state.tasks.map((t) =>
                    t.id === lastAction.taskId
                      ? { ...t, ...lastAction.previousState }
                      : t
                  ),
                }));
              }
              break;
          }

          // Move action to redo stack
          set((state) => ({
            actionHistory: state.actionHistory.slice(0, -1),
            redoStack: [...state.redoStack, lastAction],
          }));

          // Also call backend undo
          await historyApi.undo();
        } catch (error) {
          console.error('Undo failed:', error);
        }
      },

      redo: async () => {
        const { redoStack } = get();
        if (redoStack.length === 0) return;

        const action = redoStack[redoStack.length - 1];
        
        try {
          // Perform redo based on action type
          switch (action.type) {
            case 'create':
              // Re-create the task
              if (action.newState) {
                set((state) => ({
                  tasks: [...state.tasks, action.newState as Task],
                }));
              }
              break;
            case 'delete':
              // Delete again
              set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== action.taskId),
              }));
              break;
            case 'update':
            case 'move':
              // Apply new state
              if (action.newState) {
                set((state) => ({
                  tasks: state.tasks.map((t) =>
                    t.id === action.taskId
                      ? { ...t, ...action.newState }
                      : t
                  ),
                }));
              }
              break;
          }

          // Move action back to history
          set((state) => ({
            redoStack: state.redoStack.slice(0, -1),
            actionHistory: [...state.actionHistory, action],
          }));

          // Also call backend redo
          await historyApi.redo();
        } catch (error) {
          console.error('Redo failed:', error);
        }
      },

      // ============================================
      // PREFERENCES
      // ============================================

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },
    }),
    {
      name: 'focusflow-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        visibleDays: state.visibleDays,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const useInboxTasks = () =>
  useAppStore((state) => state.tasks.filter((t) => t.date === null));

export const useTasksByDate = (date: string) =>
  useAppStore((state) => state.tasks.filter((t) => t.date === date));

export const useTasksByProject = (projectId: string) =>
  useAppStore((state) => state.tasks.filter((t) => t.projectId === projectId));

export const useSelectedTask = () =>
  useAppStore((state) =>
    state.selectedTaskId ? state.tasks.find((t) => t.id === state.selectedTaskId) : null
  );

export const useActiveTask = () =>
  useAppStore((state) => state.tasks.find((t) => t.status === 'in-progress'));

export const useProjectById = (id: string) =>
  useAppStore((state) => state.projects.find((p) => p.id === id));

export const useCanUndo = () =>
  useAppStore((state) => state.actionHistory.length > 0);

export const useCanRedo = () =>
  useAppStore((state) => state.redoStack.length > 0);
