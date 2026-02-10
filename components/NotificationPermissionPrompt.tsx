/**
 * NotificationPermissionPrompt - ADHD-friendly permission request for browser notifications
 * Shows a friendly card explaining what notifications will be sent with granular opt-in
 */

'use client';

import React, { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';

interface NotificationPermissionPromptProps {
    isOpen: boolean;
    onRequestPermission: (enabledTypes: NotificationType[]) => Promise<void>;
    onDismiss: (dontAskAgain: boolean) => void;
}

type NotificationType = 'pomodoro' | 'rollover' | 'dependency';

interface NotificationOption {
    type: NotificationType;
    title: string;
    description: string;
    defaultEnabled: boolean;
}

const notificationOptions: NotificationOption[] = [
    {
        type: 'pomodoro',
        title: 'Pomodoro Timer',
        description: 'Get notified when your focus session or break ends',
        defaultEnabled: true,
    },
    {
        type: 'rollover',
        title: 'Daily Rollover',
        description: 'See which tasks moved from yesterday',
        defaultEnabled: true,
    },
    {
        type: 'dependency',
        title: 'Task Unlocked',
        description: 'Know when blocked tasks become available',
        defaultEnabled: true,
    },
];

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
    isOpen,
    onRequestPermission,
    onDismiss,
}) => {
    const [enabledTypes, setEnabledTypes] = useState<Set<NotificationType>>(
        new Set(notificationOptions.filter((opt) => opt.defaultEnabled).map((opt) => opt.type))
    );
    const [isRequesting, setIsRequesting] = useState(false);

    if (!isOpen) return null;

    const toggleType = (type: NotificationType) => {
        const newSet = new Set(enabledTypes);
        if (newSet.has(type)) {
            newSet.delete(type);
        } else {
            newSet.add(type);
        }
        setEnabledTypes(newSet);
    };

    const handleEnable = async () => {
        setIsRequesting(true);
        try {
            await onRequestPermission(Array.from(enabledTypes));
        } catch (error) {
            console.error('Error requesting permission:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleDismiss = () => {
        onDismiss(false);
    };

    const handleDontAskAgain = () => {
        onDismiss(true);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9998] max-w-md animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Stay on Track</h3>
                                <p className="text-blue-100 text-sm">
                                    Get helpful nudges when you need them
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            aria-label="Dismiss"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Notification Options */}
                    <div className="space-y-2">
                        {notificationOptions.map((option) => {
                            const isEnabled = enabledTypes.has(option.type);
                            return (
                                <button
                                    key={option.type}
                                    onClick={() => toggleType(option.type)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        isEnabled
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                                isEnabled
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : 'border-gray-300 bg-white'
                                            }`}
                                        >
                                            {isEnabled && <Check size={14} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-900">
                                                {option.title}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-0.5">
                                                {option.description}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500 px-1">
                        We&apos;ll only notify you when the app is in the background. You can change these
                        settings anytime in your preferences.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleEnable}
                            disabled={enabledTypes.size === 0 || isRequesting}
                            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                                enabledTypes.size === 0 || isRequesting
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                            }`}
                        >
                            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                        </button>
                        <button
                            onClick={handleDontAskAgain}
                            className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Don&apos;t ask again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
