/**
 * Shared Badge Components
 * Read-only badges used across task cards
 */

import React from 'react';
import { Flag, BatteryLow, BatteryMedium, BatteryFull, RotateCcw, Clock } from 'lucide-react';
import { Priority, EnergyLevel } from '@/types';

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const styles = {
        low: 'bg-slate-100 text-slate-600',
        medium: 'bg-blue-100 text-blue-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[priority]}`}>
            {priority === 'urgent' && <Flag size={10} className="inline mr-0.5" />}
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
    );
};

export const EnergyBadge: React.FC<{ level: EnergyLevel }> = ({ level }) => {
    const config = {
        low: { icon: <BatteryLow size={12} />, color: 'text-slate-500' },
        medium: { icon: <BatteryMedium size={12} />, color: 'text-amber-500' },
        high: { icon: <BatteryFull size={12} />, color: 'text-green-500' },
    };
    return <span className={config[level].color}>{config[level].icon}</span>;
};

export const RolloverBadge: React.FC<{ count: number }> = ({ count }) => {
    if (count === 0) return null;

    const config = {
        low: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
        medium: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
        high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    };

    const level = count <= 2 ? 'low' : count <= 4 ? 'medium' : 'high';
    const style = config[level];

    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border} flex items-center gap-0.5`} title={`Rolled over ${count} time${count > 1 ? 's' : ''}`}>
            <RotateCcw size={10} />
            {count}
        </span>
    );
};

export const TaskAgeBadge: React.FC<{ createdAt: string }> = ({ createdAt }) => {
    const daysOld = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (daysOld < 3) return null;

    const config = {
        aging: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
        stale: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
        stuck: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    };

    const level = daysOld < 7 ? 'aging' : daysOld < 14 ? 'stale' : 'stuck';
    const style = config[level];

    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${style.bg} ${style.text} ${style.border} flex items-center gap-0.5`} title={`Created ${daysOld} days ago`}>
            <Clock size={10} />
            {daysOld}d
        </span>
    );
};
