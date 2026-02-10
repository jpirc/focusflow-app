-- RLS hardening for Supabase warning:
-- "RLS Disabled in Public" on public."UserNotificationSettings"
--
-- This migration is idempotent and safe to run multiple times.
-- It enables RLS and adds a backend-only policy so PostgREST-exposed
-- client roles cannot read/write this table directly.

DO $$
BEGIN
  IF to_regclass('public."UserNotificationSettings"') IS NULL THEN
    RAISE NOTICE 'Table public."UserNotificationSettings" does not exist. Skipping.';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public."UserNotificationSettings" ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'UserNotificationSettings'
      AND policyname = 'user_notification_settings_backend_only'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "user_notification_settings_backend_only"
      ON public."UserNotificationSettings"
      FOR ALL
      USING (
        current_user = 'service_role'
        OR current_user = 'postgres'
        OR current_user LIKE 'postgres.%'
      )
      WITH CHECK (
        current_user = 'service_role'
        OR current_user = 'postgres'
        OR current_user LIKE 'postgres.%'
      )
    $policy$;
  END IF;
END
$$;
