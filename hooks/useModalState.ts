/**
 * useModalState - Manages all modal open/close state
 * Consolidates modal state to avoid prop drilling
 */

import { useState, useCallback, useRef } from 'react';
import { Task, Project } from '@/types';
import { TaskSwitchRequest } from '@/components/TaskSwitchModal';

export function useModalState() {
    // Edit task modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [taskToEditId, setTaskToEditId] = useState<string | null>(null);

    // AI breakdown modal
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [taskForAI, setTaskForAI] = useState<Task | null>(null);

    // Create/edit project modal
    const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Smart capture modal (Cmd+K)
    const [smartCaptureModalOpen, setSmartCaptureModalOpen] = useState(false);

    // Daily priorities modal
    const [dailyPrioritiesModalOpen, setDailyPrioritiesModalOpen] = useState(false);

    // Quick win modal
    const [quickWinModalOpen, setQuickWinModalOpen] = useState(false);
    const [quickWinTrigger, setQuickWinTrigger] = useState<'completion' | 'manual' | 'low-energy'>('manual');

    // Task switch modal (replaces window.confirm for task switching)
    const [taskSwitchModalOpen, setTaskSwitchModalOpen] = useState(false);
    const [taskSwitchRequest, setTaskSwitchRequest] = useState<TaskSwitchRequest | null>(null);
    const taskSwitchResolveRef = useRef<((confirmed: boolean) => void) | null>(null);

    // Helper: Request task switch confirmation (returns promise)
    const requestTaskSwitch = useCallback((request: TaskSwitchRequest): Promise<boolean> => {
        return new Promise((resolve) => {
            taskSwitchResolveRef.current = resolve;
            setTaskSwitchRequest(request);
            setTaskSwitchModalOpen(true);
        });
    }, []);

    // Helper: Confirm task switch
    const confirmTaskSwitch = useCallback(() => {
        if (taskSwitchResolveRef.current) {
            taskSwitchResolveRef.current(true);
            taskSwitchResolveRef.current = null;
        }
        setTaskSwitchModalOpen(false);
        setTaskSwitchRequest(null);
    }, []);

    // Helper: Cancel task switch
    const cancelTaskSwitch = useCallback(() => {
        if (taskSwitchResolveRef.current) {
            taskSwitchResolveRef.current(false);
            taskSwitchResolveRef.current = null;
        }
        setTaskSwitchModalOpen(false);
        setTaskSwitchRequest(null);
    }, []);

    // Helper: Open edit modal for a specific task
    const openEditModal = (taskId: string) => {
        setTaskToEditId(taskId);
        setEditModalOpen(true);
    };

    // Helper: Close edit modal
    const closeEditModal = () => {
        setEditModalOpen(false);
        setTaskToEditId(null);
    };

    // Helper: Open AI modal for a task
    const openAIModal = (task: Task) => {
        setTaskForAI(task);
        setAiModalOpen(true);
    };

    // Helper: Close AI modal
    const closeAIModal = () => {
        setAiModalOpen(false);
        setTaskForAI(null);
    };

    // Helper: Open project modal (create or edit)
    const openProjectModal = (project?: Project) => {
        setEditingProject(project || null);
        setCreateProjectModalOpen(true);
    };

    // Helper: Close project modal
    const closeProjectModal = () => {
        setCreateProjectModalOpen(false);
        setEditingProject(null);
    };

    return {
        // Edit task modal
        editModalOpen,
        setEditModalOpen,
        taskToEditId,
        setTaskToEditId,
        openEditModal,
        closeEditModal,

        // AI modal
        aiModalOpen,
        setAiModalOpen,
        taskForAI,
        setTaskForAI,
        openAIModal,
        closeAIModal,

        // Project modal
        createProjectModalOpen,
        setCreateProjectModalOpen,
        editingProject,
        setEditingProject,
        openProjectModal,
        closeProjectModal,

        // Smart capture
        smartCaptureModalOpen,
        setSmartCaptureModalOpen,

        // Daily priorities
        dailyPrioritiesModalOpen,
        setDailyPrioritiesModalOpen,

        // Quick win
        quickWinModalOpen,
        setQuickWinModalOpen,
        quickWinTrigger,
        setQuickWinTrigger,

        // Task switch
        taskSwitchModalOpen,
        taskSwitchRequest,
        requestTaskSwitch,
        confirmTaskSwitch,
        cancelTaskSwitch,
    };
}
