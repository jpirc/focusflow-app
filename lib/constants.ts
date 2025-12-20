/**
 * Application Constants
 * Shared configuration used across the app
 */

import React from 'react';
import { Clock, Sunrise, Sun, Sunset } from 'lucide-react';
import { TimeBlockConfig, EnergyLevel, TimeBlock } from '@/types';

/**
 * Time block configuration for the daily schedule
 */
export const TIME_BLOCKS: TimeBlockConfig[] = [
    {
        id: 'anytime',
        label: 'Anytime',
        icon: React.createElement(Clock, { size: 16 }),
        hours: 'Flexible',
        energyMatch: 'medium',
    },
    {
        id: 'morning',
        label: 'Morning',
        icon: React.createElement(Sunrise, { size: 16 }),
        hours: '6 AM - 12 PM',
        energyMatch: 'high',
    },
    {
        id: 'afternoon',
        label: 'Afternoon',
        icon: React.createElement(Sun, { size: 16 }),
        hours: '12 PM - 5 PM',
        energyMatch: 'medium',
    },
    {
        id: 'evening',
        label: 'Evening',
        icon: React.createElement(Sunset, { size: 16 }),
        hours: '5 PM - 10 PM',
        energyMatch: 'low',
    },
];

/**
 * Default project for tasks without a project
 */
export const DEFAULT_PROJECT = {
    id: 'default',
    name: 'No Project',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: 'folder',
};

/**
 * View options for the timeline
 * 7 = "Week" view (Sunday-Saturday)
 * 30 = "Month" view (calendar grid)
 */
export const VIEW_DAY_OPTIONS = [1, 3, 7, 30] as const;

/**
 * Default values for new tasks
 */
export const TASK_DEFAULTS = {
    timeBlock: 'anytime' as TimeBlock,
    priority: 'medium' as const,
    energyLevel: 'medium' as EnergyLevel,
    estimatedMinutes: 30,
    icon: 'target',
};
