/**
 * Theme System for Dopatika
 * Allows users to customize the app's color scheme
 */

export type ThemeId = 'ocean' | 'forest' | 'sunset' | 'lavender' | 'monochrome';

export interface Theme {
    id: ThemeId;
    name: string;
    description: string;
    colors: {
        // Primary gradient (used in headers, banners, highlights)
        primaryFrom: string;  // Hex color
        primaryTo: string;    // Hex color
        
        // Accent color (used in Top3, special sections)
        accentFrom: string;   // Hex color
        accentTo: string;     // Hex color
        accentBorder: string; // Hex color
        
        // Drag & drop feedback
        dragBorder: string;   // Hex color
        dragBg: string;       // Hex color
    };
}

export const THEMES: Record<ThemeId, Theme> = {
    ocean: {
        id: 'ocean',
        name: 'Ocean Blue',
        description: 'Calming blues and cyans for focus and clarity',
        colors: {
            primaryFrom: '#2563eb',  // blue-600
            primaryTo: '#0891b2',    // cyan-600
            accentFrom: '#eff6ff',   // blue-50
            accentTo: '#ecfeff',     // cyan-50
            accentBorder: '#bfdbfe', // blue-200
            dragBorder: '#60a5fa',   // blue-400
            dragBg: '#eff6ff',       // blue-50
        },
    },
    forest: {
        id: 'forest',
        name: 'Forest Green',
        description: 'Peaceful greens and earth tones for grounding',
        colors: {
            primaryFrom: '#059669',  // emerald-600
            primaryTo: '#0d9488',    // teal-600
            accentFrom: '#ecfdf5',   // emerald-50
            accentTo: '#f0fdfa',     // teal-50
            accentBorder: '#a7f3d0', // emerald-200
            dragBorder: '#34d399',   // emerald-400
            dragBg: '#ecfdf5',       // emerald-50
        },
    },
    sunset: {
        id: 'sunset',
        name: 'Warm Sunset',
        description: 'Energizing oranges and pinks for motivation',
        colors: {
            primaryFrom: '#f97316',  // orange-500
            primaryTo: '#ec4899',    // pink-500
            accentFrom: '#fff7ed',   // orange-50
            accentTo: '#fdf2f8',     // pink-50
            accentBorder: '#fed7aa', // orange-200
            dragBorder: '#fb923c',   // orange-400
            dragBg: '#fff7ed',       // orange-50
        },
    },
    lavender: {
        id: 'lavender',
        name: 'Lavender Dreams',
        description: 'Soft purples and blues for relaxation',
        colors: {
            primaryFrom: '#9333ea',  // purple-600
            primaryTo: '#2563eb',    // blue-600
            accentFrom: '#faf5ff',   // purple-50
            accentTo: '#eff6ff',     // blue-50
            accentBorder: '#e9d5ff', // purple-200
            dragBorder: '#c084fc',   // purple-400
            dragBg: '#faf5ff',       // purple-50
        },
    },
    monochrome: {
        id: 'monochrome',
        name: 'Minimal Gray',
        description: 'Neutral grays for minimal distraction',
        colors: {
            primaryFrom: '#475569',  // slate-600
            primaryTo: '#4b5563',    // gray-600
            accentFrom: '#f8fafc',   // slate-50
            accentTo: '#f9fafb',     // gray-50
            accentBorder: '#e2e8f0', // slate-200
            dragBorder: '#94a3b8',   // slate-400
            dragBg: '#f8fafc',       // slate-50
        },
    },
};

export const DEFAULT_THEME: ThemeId = 'ocean';

export function getTheme(themeId: ThemeId = DEFAULT_THEME): Theme {
    return THEMES[themeId];
}

export function getStoredTheme(): ThemeId {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = localStorage.getItem('dopatika_theme');
    return (stored as ThemeId) || DEFAULT_THEME;
}

export function setStoredTheme(themeId: ThemeId): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dopatika_theme', themeId);
}
