import { useCallback, useEffect, useState } from 'react';
import type { PrivacyLevel, SuggestionFrequency } from '@/lib/intelligence/types';

export interface IntelligenceFeatureSettings {
    smartSuggestions: boolean;
    aiBreakdown: boolean;
    autoScheduling: boolean;
    learningEnabled: boolean;
    suggestionFrequency: SuggestionFrequency;
    privacyLevel: PrivacyLevel;
}

const DEFAULT_FEATURES: IntelligenceFeatureSettings = {
    smartSuggestions: true,
    aiBreakdown: true,
    autoScheduling: false,
    learningEnabled: true,
    suggestionFrequency: 'balanced',
    privacyLevel: 'full',
};

interface UseIntelligenceFeaturesOptions {
    isAuthenticated: boolean;
}

export function useIntelligenceFeatures({ isAuthenticated }: UseIntelligenceFeaturesOptions) {
    const [features, setFeatures] = useState<IntelligenceFeatureSettings>(DEFAULT_FEATURES);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFeatures = useCallback(async () => {
        if (!isAuthenticated) {
            setFeatures(DEFAULT_FEATURES);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/intelligence/features', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch intelligence feature settings');
            const data = await res.json();
            setFeatures({
                smartSuggestions: data.smartSuggestions ?? DEFAULT_FEATURES.smartSuggestions,
                aiBreakdown: data.aiBreakdown ?? DEFAULT_FEATURES.aiBreakdown,
                autoScheduling: data.autoScheduling ?? DEFAULT_FEATURES.autoScheduling,
                learningEnabled: data.learningEnabled ?? DEFAULT_FEATURES.learningEnabled,
                suggestionFrequency: data.suggestionFrequency ?? DEFAULT_FEATURES.suggestionFrequency,
                privacyLevel: data.privacyLevel ?? DEFAULT_FEATURES.privacyLevel,
            });
        } catch (err) {
            console.error('Failed to fetch intelligence features:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const updateFeatures = useCallback(async (patch: Partial<IntelligenceFeatureSettings>) => {
        if (!isAuthenticated) {
            setFeatures(prev => ({ ...prev, ...patch }));
            return false;
        }

        const previous = features;
        setFeatures(prev => ({ ...prev, ...patch }));

        try {
            setSaving(true);
            setError(null);
            const res = await fetch('/api/intelligence/features', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error('Failed to save intelligence feature settings');

            const data = await res.json();
            setFeatures({
                smartSuggestions: data.smartSuggestions ?? DEFAULT_FEATURES.smartSuggestions,
                aiBreakdown: data.aiBreakdown ?? DEFAULT_FEATURES.aiBreakdown,
                autoScheduling: data.autoScheduling ?? DEFAULT_FEATURES.autoScheduling,
                learningEnabled: data.learningEnabled ?? DEFAULT_FEATURES.learningEnabled,
                suggestionFrequency: data.suggestionFrequency ?? DEFAULT_FEATURES.suggestionFrequency,
                privacyLevel: data.privacyLevel ?? DEFAULT_FEATURES.privacyLevel,
            });
            return true;
        } catch (err) {
            console.error('Failed to update intelligence features:', err);
            setFeatures(previous);
            setError(err instanceof Error ? err.message : 'Failed to save settings');
            return false;
        } finally {
            setSaving(false);
        }
    }, [features, isAuthenticated]);

    useEffect(() => {
        void fetchFeatures();
    }, [fetchFeatures]);

    return {
        features,
        loading,
        saving,
        error,
        fetchFeatures,
        updateFeatures,
    };
}

