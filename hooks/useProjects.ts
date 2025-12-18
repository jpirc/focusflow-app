/**
 * useProjects Hook - Manages all project state and operations
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Project } from '@/types';
import { projectApi, CreateProjectInput, UpdateProjectInput } from '@/lib/api/client';
import { DEFAULT_PROJECT } from '@/lib/constants';

interface UseProjectsOptions {
    /** Whether user is authenticated */
    isAuthenticated: boolean;
}

interface UseProjectsReturn {
    projects: Project[];
    selectedProjectId: string | null;
    
    // Selection
    selectProject: (id: string | null) => void;
    
    // CRUD
    createProject: (input: CreateProjectInput) => Promise<Project | null>;
    updateProject: (id: string, updates: UpdateProjectInput) => Promise<boolean>;
    deleteProject: (id: string) => Promise<boolean>;
    
    // Utilities
    getProjectById: (id: string | undefined) => Project;
    refreshProjects: () => Promise<void>;
}

export function useProjects({ isAuthenticated }: UseProjectsOptions): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    // ============================================
    // Fetch & Refresh
    // ============================================

    const refreshProjects = useCallback(async () => {
        if (!isAuthenticated) return;

        const result = await projectApi.getAll();
        if (result.data) {
            setProjects(result.data);
        }
    }, [isAuthenticated]);

    // Initial fetch
    useEffect(() => {
        if (isAuthenticated) {
            refreshProjects();
        }
    }, [isAuthenticated, refreshProjects]);

    // ============================================
    // Selection
    // ============================================

    const selectProject = useCallback((id: string | null) => {
        setSelectedProjectId(prev => prev === id ? null : id);
    }, []);

    // ============================================
    // CRUD
    // ============================================

    const createProject = useCallback(async (input: CreateProjectInput): Promise<Project | null> => {
        if (!isAuthenticated) return null;

        const result = await projectApi.create(input);
        if (result.data) {
            setProjects(prev => [...prev, result.data!]);
            return result.data;
        } else {
            alert(result.error || 'Failed to create project');
            return null;
        }
    }, [isAuthenticated]);

    const updateProject = useCallback(async (id: string, updates: UpdateProjectInput): Promise<boolean> => {
        if (!isAuthenticated) return false;

        const result = await projectApi.update(id, updates);
        if (result.data) {
            setProjects(prev => prev.map(p => p.id === id ? result.data! : p));
            return true;
        } else {
            alert(result.error || 'Failed to update project');
            return false;
        }
    }, [isAuthenticated]);

    const deleteProject = useCallback(async (id: string): Promise<boolean> => {
        if (!isAuthenticated) return false;

        const result = await projectApi.delete(id);
        if (result.data) {
            setProjects(prev => prev.filter(p => p.id !== id));
            if (selectedProjectId === id) {
                setSelectedProjectId(null);
            }
            return true;
        } else {
            alert(result.error || 'Failed to delete project');
            return false;
        }
    }, [isAuthenticated, selectedProjectId]);

    // ============================================
    // Utilities
    // ============================================

    const getProjectById = useCallback((id: string | undefined): Project => {
        if (!id) return DEFAULT_PROJECT as Project;
        return projects.find(p => p.id === id) || DEFAULT_PROJECT as Project;
    }, [projects]);

    return {
        projects,
        selectedProjectId,
        selectProject,
        createProject,
        updateProject,
        deleteProject,
        getProjectById,
        refreshProjects,
    };
}
