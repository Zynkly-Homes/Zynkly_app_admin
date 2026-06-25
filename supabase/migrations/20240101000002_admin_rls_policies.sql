-- Migration: 20240101000002_admin_rls_policies.sql
-- Row Level Security policies for admin dashboard access.
-- 
-- DESIGN DECISION:
-- Admins use Supabase Auth + anon key with RLS.
-- The anon key is used from the browser — RLS prevents unauthorized access.
-- Service-role operations (admin invite, hard delete) use Edge Functions.

-- Enable RLS on all relevant tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceable_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_leaves ENABLE ROW LEVEL SECURITY;

-- ─── Helper function ──────────────────────────────────────────────────────────

-- Returns true if the calling user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
    AND is_active = true
  );
$$;

-- Returns true if the calling user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
$$;

-- ─── Admins table policies ────────────────────────────────────────────────────

-- Any admin can read all admin records
CREATE POLICY "Admins can read admin list"
  ON public.admins FOR SELECT
  USING (public.is_admin());

-- Only super admins can modify admin records
CREATE POLICY "Super admins can modify admins"
  ON public.admins FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─── Admin logs policies ──────────────────────────────────────────────────────

CREATE POLICY "Admins can read logs"
  ON public.admin_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- ─── Bookings policies ────────────────────────────────────────────────────────

CREATE POLICY "Admins can read all bookings"
  ON public.bookings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Users (customers) policies ──────────────────────────────────────────────

-- Customers can read their own record
CREATE POLICY "Users can read own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- ─── Cleaners policies ────────────────────────────────────────────────────────

CREATE POLICY "Admins can read cleaners"
  ON public.cleaners FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert cleaners"
  ON public.cleaners FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update cleaners"
  ON public.cleaners FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Services policies ────────────────────────────────────────────────────────

-- Services are public (mobile app reads them without auth)
CREATE POLICY "Services are publicly readable"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage services"
  ON public.services FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─── Reviews policies ────────────────────────────────────────────────────────

CREATE POLICY "Admins can read all reviews"
  ON public.reviews FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update reviews"
  ON public.reviews FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Pincodes policies ───────────────────────────────────────────────────────

-- Public read (mobile app checks pincode for serviceability)
CREATE POLICY "Pincodes publicly readable"
  ON public.serviceable_pincodes FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage pincodes"
  ON public.serviceable_pincodes FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─── Waitlist policies ────────────────────────────────────────────────────────

-- Anyone can insert to waitlist (mobile app)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can read waitlist"
  ON public.waitlist FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Super admins can update waitlist"
  ON public.waitlist FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─── Legal content policies ──────────────────────────────────────────────────

-- Public read
CREATE POLICY "Legal content publicly readable"
  ON public.legal_content FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage legal content"
  ON public.legal_content FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─── App config policies ─────────────────────────────────────────────────────

-- Public read (mobile app reads config like convenience_fee)
CREATE POLICY "App config publicly readable"
  ON public.app_config FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage app config"
  ON public.app_config FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─── Support tables policies ─────────────────────────────────────────────────

CREATE POLICY "Support contacts publicly readable"
  ON public.support_contacts FOR SELECT USING (true);

CREATE POLICY "Support FAQs publicly readable"
  ON public.support_faqs FOR SELECT USING (true);

CREATE POLICY "Admins can manage support FAQs"
  ON public.support_faqs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Cleaner leaves policies ─────────────────────────────────────────────────

CREATE POLICY "Admins can read cleaner leaves"
  ON public.cleaner_leaves FOR SELECT
  USING (public.is_admin());
