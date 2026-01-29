/**
 * useViewState - Manages view/layout state
 * - Current date navigation
 * - View mode (blocks vs timeline)
 * - Number of days to show
 * - Sidebar visibility
 */

import { useState, useEffect } from 'react';

export function useViewState() {
    // Current date for calendar navigation
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });

    // Number of days to show (1, 3, 5, 7)
    const [viewDays, setViewDays] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('defaultViewDays');
            return saved ? parseInt(saved, 10) : 2;
        }
        return 2;
    });

    // View mode: time blocks or timeline
    const [viewMode, setViewMode] = useState<'blocks' | 'timeline'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dopatika_view_mode');
            return (saved as 'blocks' | 'timeline') || 'timeline';
        }
        return 'timeline';
    });

    // Sidebar visibility
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Persist viewDays to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('defaultViewDays', viewDays.toString());
        }
    }, [viewDays]);

    // Persist viewMode to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dopatika_view_mode', viewMode);
        }
    }, [viewMode]);

    return {
        currentDate,
        setCurrentDate,
        viewDays,
        setViewDays,
        viewMode,
        setViewMode,
        sidebarOpen,
        setSidebarOpen,
    };
}
