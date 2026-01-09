/**
 * useTheme Hook - Manages theme selection and persistence
 */

'use client';

import { useState, useEffect } from 'react';
import { ThemeId, getStoredTheme, setStoredTheme, getTheme, Theme } from '@/lib/themes';

export function useTheme() {
    const [themeId, setThemeId] = useState<ThemeId>(() => getStoredTheme());
    const [theme, setTheme] = useState<Theme>(() => getTheme(themeId));

    useEffect(() => {
        // Load theme from localStorage on mount
        const stored = getStoredTheme();
        if (stored !== themeId) {
            setThemeId(stored);
            setTheme(getTheme(stored));
        }
    }, []);

    const changeTheme = (newThemeId: ThemeId) => {
        setThemeId(newThemeId);
        setTheme(getTheme(newThemeId));
        setStoredTheme(newThemeId);
    };

    return {
        themeId,
        theme,
        changeTheme,
    };
}
