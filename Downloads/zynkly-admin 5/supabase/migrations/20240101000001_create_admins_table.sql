-- Migration: 20240101000001_create_admins_table.sql
-- Creates the admins table and admin_logs table.
-- Run: supabase db reset OR apply via Supabase Dashboard SQL editor

-- ─── Admins table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one admin record per auth user
CREATE UNIQUE INDEX IF NOT EXISTS admins_user_id_idx ON public.admins (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_idx ON public.admins (email);

-- ─── Admin logs table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,           -- e.g. 'booking.confirmed', 'cleaner.deactivated'
  target_type TEXT,                    -- e.g. 'booking', 'cleaner', 'service'
  target_id   TEXT,                    -- ID of the affected resource
  metadata    JSONB DEFAULT '{}',      -- any extra context
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON public.admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs (created_at DESC);

-- ─── Create first Super Admin ─────────────────────────────────────────────────
-- After running this migration, insert the first super admin manually:
--
-- INSERT INTO public.admins (user_id, email, name, role)
-- VALUES (
--   '<UUID from auth.users>',
--   'your@email.com',
--   'Your Name',
--   'super_admin'
-- );
