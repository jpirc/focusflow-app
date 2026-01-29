/**
 * LocalStorage Migration Hook
 * Migrates data from FocusFlow keys to Dopatika keys
 * Runs once on app load to preserve user preferences
 */

import { useEffect } from 'react';

const MIGRATIONS = [
  { old: 'focusflow_theme', new: 'dopatika_theme' },
  { old: 'focusflow_view_mode', new: 'dopatika_view_mode' },
  { old: 'focusflow_daily_streak', new: 'dopatika_daily_streak' },
  { old: 'focusflow_anytime_collapsed', new: 'dopatika_anytime_collapsed' },
  { old: 'focusflow_top3_expanded', new: 'dopatika_top3_expanded' },
];

export function useLocalStorageMigration() {
  useEffect(() => {
    // Check if migration has already run
    const migrated = localStorage.getItem('dopatika_migration_complete');
    if (migrated === 'true') {
      return;
    }

    console.log('[Dopatika] Running localStorage migration from FocusFlow...');

    let migratedCount = 0;

    // Migrate each key
    MIGRATIONS.forEach(({ old, new: newKey }) => {
      const oldValue = localStorage.getItem(old);
      if (oldValue !== null) {
        localStorage.setItem(newKey, oldValue);
        localStorage.removeItem(old); // Clean up old key
        migratedCount++;
        console.log(`[Dopatika] Migrated ${old} → ${newKey}`);
      }
    });

    // Migrate dynamic keys (top3 dismissed, restart notes)
    const allKeys = Object.keys(localStorage);

    // Migrate focusflow_top3_dismissed_{date} keys
    allKeys.forEach(key => {
      if (key.startsWith('focusflow_top3_dismissed_')) {
        const newKey = key.replace('focusflow_top3_dismissed_', 'dopatika_top3_dismissed_');
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(newKey, value);
          localStorage.removeItem(key);
          migratedCount++;
        }
      }
    });

    // Migrate focusflow_restart_note_{date} keys
    allKeys.forEach(key => {
      if (key.startsWith('focusflow_restart_note_')) {
        const newKey = key.replace('focusflow_restart_note_', 'dopatika_restart_note_');
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(newKey, value);
          localStorage.removeItem(key);
          migratedCount++;
        }
      }
    });

    // Mark migration as complete
    localStorage.setItem('dopatika_migration_complete', 'true');

    console.log(`[Dopatika] Migration complete! Migrated ${migratedCount} keys.`);
  }, []);
}
