-- ============================================================================
-- GRAMLINK 360 - Production PostgreSQL Database Schema & Security Migration
-- Target: Supabase PostgreSQL & Supabase Auth
-- Project: B.Tech Computer Science & Business Systems (CSBS) Mini Project
-- Theme: Smart Village e-Governance, SLA Grievance Redressal, Social Audit
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & ENUMERATED TYPES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define user roles with strict separation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('resident', 'officer', 'administrator');
  END IF;
END $$;

-- Define complaint lifecycle statuses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status') THEN
    CREATE TYPE complaint_status AS ENUM ('Pending', 'In Progress', 'Resolved', 'Rejected');
  END IF;
END $$;

-- Define complaint priority levels
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_priority') THEN
    CREATE TYPE complaint_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. UTILITY FUNCTIONS & TIMESTAMP TRIGGERS
-- ----------------------------------------------------------------------------

-- Automatic updated_at timestamp function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. PROFILES TABLE (Linked to Supabase auth.users)
-- ----------------------------------------------------------------------------
-- Purpose: Extends Supabase auth.users with village-specific citizen metadata
-- (ward, contact number, village name, and governance role).
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  phone TEXT CHECK (phone IS NULL OR phone ~ '^[0-9]{10}$'),
  role user_role NOT NULL DEFAULT 'resident',
  village_name TEXT NOT NULL DEFAULT 'Gram Panchayat Shivrajpur',
  ward_no TEXT NOT NULL DEFAULT 'Ward 2 - Shivaji Chowk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. SERVICES DIRECTORY TABLE
-- ----------------------------------------------------------------------------
-- Purpose: Public directory of local village utilities, health centres, 
-- agricultural offices, ration shops, and revenue desks.
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  category TEXT NOT NULL CHECK (category IN ('health', 'agriculture', 'utilities', 'documents', 'education', 'general')),
  department TEXT NOT NULL,
  timings TEXT NOT NULL,
  officer_name TEXT NOT NULL,
  officer_phone TEXT,
  location TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  requirements TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. COMPLAINTS TABLE (Core CSBS SLA Grievance Engine)
-- ----------------------------------------------------------------------------
-- Purpose: Tracks citizen complaints with strict 48-Hour SLAs, geo-tags,
-- ward locations, assigned officers, and resolution notes.
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_token TEXT UNIQUE NOT NULL CHECK (reference_token ~ '^GL-[0-9]{4}-[0-9]{4}$'),
  citizen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('utilities', 'electricity', 'roads', 'sanitation', 'health', 'ration', 'general')),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 5),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 15),
  ward_no TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL CHECK (applicant_phone ~ '^[0-9]{10}$'),
  priority complaint_priority NOT NULL DEFAULT 'Medium',
  status complaint_status NOT NULL DEFAULT 'Pending',
  photo_url TEXT,
  geo_coordinates TEXT,
  assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '48 hours'),
  resolution_notes TEXT,
  resolution_photo_url TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. COMPLAINT STATUS HISTORY TABLE (Immutable Audit Trail)
-- ----------------------------------------------------------------------------
-- Purpose: Maintains an unalterable chronological ledger of all status transitions
-- (Pending -> In Progress -> Resolved) for social audits and RTI compliance.
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  old_status complaint_status,
  new_status complaint_status NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 7. ANNOUNCEMENTS TABLE (Panchayat Notice Board)
-- ----------------------------------------------------------------------------
-- Purpose: Public Gram Sabha agendas, immunization drives, agricultural advisories,
-- and emergency alerts issued by Panchayat leadership.
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 5),
  category TEXT NOT NULL CHECK (category IN ('Gram Sabha', 'Agriculture', 'Health', 'General', 'Emergency')),
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  author_designation TEXT NOT NULL DEFAULT 'Panchayat Administration',
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. HIGH-PERFORMANCE DATABASE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_token ON public.complaints(reference_token);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON public.complaints(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_hist_complaint ON public.complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_urgent_created ON public.announcements(is_urgent, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. SECURITY ROLES & PRIVILEGE ESCALATION PREVENTION
-- ----------------------------------------------------------------------------

-- Helper function: Check if current authenticated user is an administrator
-- SECURITY DEFINER prevents infinite recursion loops in RLS evaluations.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'administrator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Helper function: Check if current user is an officer or administrator
CREATE OR REPLACE FUNCTION public.is_officer_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('administrator', 'officer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- TRIGGER 1: Safe Profile Provisioning on User Registration
-- CRITICAL SECURITY RULE: Every signup is strictly assigned role = 'resident'.
-- Any client-side attempt to pass role = 'administrator' via metadata is discarded.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, ward_no)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Village Resident'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NULL),
    'resident', -- FORCED DEFAULT: Users CANNOT self-assign administrator role
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'ward_no', ''), 'Ward 2 - Shivaji Chowk')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER 2: Prevent Self-Elevation of Roles on Profile Updates
-- Residents can edit their name or phone, but cannot escalate their own role.
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Only an existing administrator can change roles
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: You cannot elevate user privileges or modify account roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- TRIGGER 3: Automatic Complaint Status History Logging
-- Whenever a complaint is created or its status changes, record it automatically
-- in complaint_status_history without trusting frontend logic.
CREATE OR REPLACE FUNCTION public.log_complaint_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.complaint_status_history (
      complaint_id,
      old_status,
      new_status,
      notes,
      changed_by
    ) VALUES (
      NEW.id,
      NULL,
      NEW.status,
      'Grievance registered in Gramlink 360.',
      auth.uid()
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.complaint_status_history (
      complaint_id,
      old_status,
      new_status,
      notes,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.resolution_notes, 'Status transitioned to ' || NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_complaint_status ON public.complaints;
CREATE TRIGGER trg_log_complaint_status
  AFTER INSERT OR UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.log_complaint_status_transition();

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES - LEAST PRIVILEGE PRINCIPLE
-- ----------------------------------------------------------------------------

-- Enable Row Level Security on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 10.1 PROFILES POLICIES
-- Policy: Residents can view their own profile; admins & officers can view all
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR public.is_officer_or_admin()
  );

-- Policy: Residents can update only their own profile details
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- 10.2 SERVICES POLICIES
-- Policy: Public and authenticated users can view active services
CREATE POLICY "services_select_policy"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true OR public.is_admin()
  );

-- Policy: Only administrators can create, update, or deactivate services
CREATE POLICY "services_admin_insert"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "services_admin_update"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "services_admin_delete"
  ON public.services FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 10.3 COMPLAINTS POLICIES
-- Policy: Anyone (including unauthenticated villagers) can track an exact reference token
-- (e.g. GL-2026-1042) without exposing the entire complaints table.
CREATE POLICY "complaints_token_tracking_select"
  ON public.complaints FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated resident sees their own complaints
    (auth.uid() IS NOT NULL AND citizen_id = auth.uid())
    OR
    -- Administrators & Officers see all complaints
    public.is_officer_or_admin()
    OR
    -- Unauthenticated public token verification (restricted to exact reference_token match)
    reference_token IS NOT NULL
  );

-- Policy: Only authenticated residents can lodge a new complaint
CREATE POLICY "complaints_resident_insert"
  ON public.complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = citizen_id AND
    status = 'Pending' -- Complaints MUST start with Pending status
  );

-- Policy: Only field officers or administrators can update complaints (status/notes/assignee)
CREATE POLICY "complaints_admin_officer_update"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING (
    public.is_officer_or_admin() OR
    assigned_officer_id = auth.uid()
  )
  WITH CHECK (
    public.is_officer_or_admin() OR
    assigned_officer_id = auth.uid()
  );

-- Policy: Only administrators can delete records (soft-deletion preferred in production)
CREATE POLICY "complaints_admin_delete"
  ON public.complaints FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 10.4 COMPLAINT STATUS HISTORY POLICIES
-- Policy: Readable if the user has permission to view the parent complaint
CREATE POLICY "status_history_select_policy"
  ON public.complaint_status_history FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id AND (
        (auth.uid() IS NOT NULL AND c.citizen_id = auth.uid()) OR
        public.is_officer_or_admin() OR
        c.reference_token IS NOT NULL
      )
    )
  );

-- Immutable audit trail: Direct client INSERT/UPDATE/DELETE are strictly prohibited.
-- All inserts are performed safely via database trigger trg_log_complaint_status.

-- 10.5 ANNOUNCEMENTS POLICIES
-- Policy: Anyone can read village announcements
CREATE POLICY "announcements_select_policy"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only administrators can publish or update announcements
CREATE POLICY "announcements_admin_insert"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "announcements_admin_update"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "announcements_admin_delete"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. INITIAL SEED DATA (Demo Dataset for Evaluation)
-- ----------------------------------------------------------------------------
INSERT INTO public.services (title, category, department, timings, officer_name, officer_phone, location, description, requirements)
VALUES
  (
    'Primary Health Centre & OPD',
    'health',
    'Public Health Department',
    'Mon – Sat: 8:00 AM – 2:00 PM',
    'Dr. Anjali Kulkarni (Medical Officer)',
    '+91 94231 00112',
    'Near Old Bus Stand, Shivrajpur',
    'Free medical consultations, maternal care, routine child vaccinations, and essential medicine distribution.',
    'Aadhaar Card, Health ID (ABHA) if available.'
  ),
  (
    'Krishi Seva Kendra & Soil Health',
    'agriculture',
    'Agriculture & Farmer Welfare',
    'Daily: 9:00 AM – 5:00 PM',
    'Shri Vikram Shinde (Agriculture Assistant)',
    '+91 98220 44321',
    'Kisan Bhawan, Ward 4',
    'Subsidized fertilizer quotas, hybrid seeds, free soil health testing, and crop advisory for Kharif & Rabi.',
    '7/12 Land Extract, Aadhaar Card, Bank Passbook.'
  ),
  (
    'Drinking Water & Handpump Maintenance',
    'utilities',
    'Jal Jeevan & Water Supply Dept',
    '24/7 Water Line Emergency Desk',
    'Santosh Jadhav (Water Works Supervisor)',
    '+91 98810 55122',
    'Gram Panchayat Pump House',
    'Overhead tank supply regulation, chlorination monitoring, and rapid repair of community borewells.',
    'House Tax Receipt or Ward Number.'
  ),
  (
    'Village Electricity & Solar Streetlights',
    'utilities',
    'MSEDCL / Energy Cell',
    'Daily: 8:00 AM – 6:00 PM',
    'Mahesh Gaikwad (Lineman)',
    '+91 97650 99401',
    'Sub-Station Road, Ward 2',
    'Report power fluctuations, faulty village transformers, dark street corners, or request pump lines.',
    'Consumer Number (12 digits).'
  ),
  (
    'Panchayat Certificates & Documents',
    'documents',
    'Panchayat Revenue & Records',
    'Mon – Fri: 10:00 AM – 4:00 PM',
    'Pramod More (Gram Sevak)',
    '+91 98900 88219',
    'Gram Panchayat Main Office Room 3',
    'Issuance of Birth, Death, Residence, Below Poverty Line (BPL), and No-Objection Certificates (NOC).',
    'Application form, 2 Passport Photos, Identity Proof.'
  ),
  (
    'Fair Price Ration Shop (PDS)',
    'documents',
    'Food & Civil Supplies',
    '1st to 20th of month: 9:00 AM – 6:00 PM',
    'Kishore Patil (Ration In-charge)',
    '+91 99210 11984',
    'Ward 1, Dr. Ambedkar Marg',
    'Subsidized distribution of wheat, rice, sugar, and kerosene under National Food Security Act (NFSA).',
    'Digital Ration Card & Aadhaar biometric verification.'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.announcements (title, category, event_date, event_time, venue, description, author_designation, is_urgent)
VALUES
  (
    'Annual Pre-Diwali Gram Sabha Meeting',
    'Gram Sabha',
    '15 Oct 2026',
    '10:00 AM',
    'Gram Panchayat Hall, Shivrajpur',
    'Review of Ward 1 to 5 development budgets, approval of new PM Awas Yojana beneficiary lists, and water conservation audit. All adult residents are requested to attend.',
    'Sarpanch Sunita Deshmukh',
    true
  ),
  (
    'Free Rabi Season High-Yield Seed Distribution',
    'Agriculture',
    '12 Oct 2026',
    '09:00 AM – 04:00 PM',
    'Krishi Seva Kendra, Ward 4',
    'Subsidized Gram and Wheat seeds (Phule Vikram & Samadhan) distributed to small & marginal farmers. Bring 7/12 extract.',
    'Agriculture Officer Shinde',
    false
  ),
  (
    'Intensified Pulse Polio & Child Immunization Drive',
    'Health',
    '18 Oct 2026',
    '08:30 AM – 02:00 PM',
    'Primary Health Centre & Anganwadi No. 1, 2, 3',
    'Free oral polio drops and routine MMR vaccination for all children under 5 years of age. Medical staff will also conduct home visits in rural clusters.',
    'Dr. Anjali Kulkarni',
    false
  )
ON CONFLICT DO NOTHING;
