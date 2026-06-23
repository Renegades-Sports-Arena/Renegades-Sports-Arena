-- RENEGADES SPORTS ARENA - PRODUCTION-READY SUPABASE SCHEMA
-- Re-run this entire script in the Supabase SQL Editor to perform database migrations and update policies.

-- Disable all policies before drops
DROP POLICY IF EXISTS "Enable SELECT for anonymous users" ON public.trial_bookings;
DROP POLICY IF EXISTS "Enable INSERT for anonymous users" ON public.trial_bookings;
DROP POLICY IF EXISTS "Enable UPDATE for anonymous users" ON public.trial_bookings;
DROP POLICY IF EXISTS "Enable DELETE for anonymous users" ON public.trial_bookings;

-- Clean Up/Drop existing tables & dependencies in correct order
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.email_queue CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.whatsapp_message_logs CASCADE;
DROP TABLE IF EXISTS public.whatsapp_queue CASCADE;
DROP TABLE IF EXISTS public.whatsapp_templates CASCADE;
DROP TABLE IF EXISTS public.error_logs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.booking_locks CASCADE;
DROP TABLE IF EXISTS public.coach_feedback CASCADE;
DROP TABLE IF EXISTS public.player_statistics CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.attendance_reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payment_history CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.session_plans CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.performance_reports CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.shop_orders CASCADE;
DROP TABLE IF EXISTS public.receipts CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.fixtures CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.mlb_programs CASCADE;
DROP TABLE IF EXISTS public.trial_bookings CASCADE;
DROP TABLE IF EXISTS public.coach_student_relations CASCADE;
DROP TABLE IF EXISTS public.parent_student_relations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.website_config CASCADE;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.calculate_player_attendance_stats() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_player_fitness_stats() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_trial_booking_whatsapp() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_attendance_whatsapp() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_fee_reminder_whatsapp() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_payment_confirmation_whatsapp() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_announcement_whatsapp() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_performance_report_whatsapp() CASCADE;
DROP FUNCTION IF EXISTS public.handle_payment_status_update() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_current_timestamp_updated_at() CASCADE;


-- ==========================================================================
-- 0. AUTOMATIC TIMESTAMPS SETUP
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==========================================================================
-- 1. PRIMARY SYSTEM TABLES
-- ==========================================================================

-- website_config: Site CMS contents
CREATE TABLE public.website_config (
    id INTEGER PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- profiles: Multi-role user database (extends auth.users)
CREATE TABLE public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE, -- Links to auth.users.id
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'player', 'parent', 'coach')),
    name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    bio TEXT,
    school TEXT,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- parent_student_relations: Links Parents to Players
CREATE TABLE public.parent_student_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_id, player_id)
);

-- coach_student_relations: Links Coaches to Assigned Players
CREATE TABLE public.coach_student_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(coach_id, player_id)
);

-- trial_bookings: Site booking trials roster
CREATE TABLE public.trial_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    parent_name TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    message TEXT,
    booking_date DATE NOT NULL,
    booking_slot TEXT NOT NULL, -- '6 AM', '7 AM', '8 AM', '4 PM', '5 PM', '6 PM', '7 PM'
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'rescheduled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================================================
-- 2. TOURNAMENTS, MATCHES & BRACKET SCHEDULING
-- ==========================================================================

-- mlb_programs: Baseball development courses
CREATE TABLE public.mlb_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    age_group TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    icon TEXT DEFAULT '⚾' NOT NULL,
    image_url TEXT,
    coach_name TEXT,
    achievements TEXT,
    status TEXT DEFAULT 'published' NOT NULL CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- tournaments: Cricket/Baseball contests
CREATE TABLE public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL CHECK (sport_type IN ('Cricket', 'Baseball')),
    age_category TEXT NOT NULL CHECK (age_category IN ('U-11', 'U-13', 'U-15', 'U-17', 'Open')),
    venue TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    poster_url TEXT,
    registration_status TEXT DEFAULT 'open' NOT NULL CHECK (registration_status IN ('open', 'closed', 'upcoming')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- teams: Registered squads
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- players: Tournament player roster
CREATE TABLE public.players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    age INTEGER,
    role TEXT, -- e.g. 'Batsman', 'Pitcher'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- fixtures: Matches scheduling calendar
CREATE TABLE public.fixtures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_a_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    team_b_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    cricket_overs_a NUMERIC DEFAULT 0,
    cricket_wickets_a INTEGER DEFAULT 0,
    cricket_runs_a INTEGER DEFAULT 0,
    cricket_overs_b NUMERIC DEFAULT 0,
    cricket_wickets_b INTEGER DEFAULT 0,
    cricket_runs_b INTEGER DEFAULT 0,
    baseball_innings INTEGER DEFAULT 1,
    baseball_runs_a INTEGER DEFAULT 0,
    baseball_hits_a INTEGER DEFAULT 0,
    baseball_errors_a INTEGER DEFAULT 0,
    baseball_runs_b INTEGER DEFAULT 0,
    baseball_hits_b INTEGER DEFAULT 0,
    baseball_errors_b INTEGER DEFAULT 0,
    current_innings_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- results: Completed fixture winners
CREATE TABLE public.results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE UNIQUE,
    winner_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    score_details TEXT,
    mvp_player TEXT,
    awards_details TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================================================
-- 3. PAYMENTS & COMMERCE INFRASTRUCTURE (RAZORPAY PREP)
-- ==========================================================================

-- payments: Transactions bookkeeping
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    status TEXT DEFAULT 'created' NOT NULL CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('membership_fee', 'shop_purchase', 'tournament_registration', 'other')),
    reference_id UUID,
    receipt_number TEXT UNIQUE,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- receipts: Final printable invoices
CREATE TABLE public.receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_number TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- shop_orders: Purchases registrations
CREATE TABLE public.shop_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'pending_payment' NOT NULL CHECK (status IN ('pending_payment', 'paid', 'processing', 'shipped', 'cancelled')),
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- registrations: Tournament entrants
CREATE TABLE public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    registration_type TEXT NOT NULL CHECK (registration_type IN ('team', 'individual')),
    registrant_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    age_category TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'paid')),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    qr_pass_code TEXT DEFAULT gen_random_uuid()::text NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================================================
-- 4. ACADEMY OPERATIONS, FEEDBACK & GRADES
-- ==========================================================================

-- attendance: Daily present logs
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused')),
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(player_id, date)
);

-- performance_reports: Grades sheet
CREATE TABLE public.performance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    batting INTEGER DEFAULT 0 CHECK (batting BETWEEN 0 AND 10),
    bowling INTEGER DEFAULT 0 CHECK (bowling BETWEEN 0 AND 10),
    fielding INTEGER DEFAULT 0 CHECK (fielding BETWEEN 0 AND 10),
    fitness INTEGER DEFAULT 0 CHECK (fitness BETWEEN 0 AND 10),
    feedback TEXT,
    report_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- certificates: Awards catalog
CREATE TABLE public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    badge_type TEXT NOT NULL CHECK (badge_type IN ('Gold', 'Silver', 'Bronze', 'Elite', 'Rookie')),
    date_issued DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- session_plans: Coach lesson guidelines
CREATE TABLE public.session_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    topic TEXT,
    drills TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- announcements: Broadcaster bulletins
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT DEFAULT 'all' NOT NULL CHECK (target_role IN ('all', 'player', 'parent', 'coach')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- payment_history: Fee dues & invoices
CREATE TABLE public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    billing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================================================
-- 5. NOTIFICATION CENTER (WHATSAPP, EMAIL, BROWSER PUSH)
-- ==========================================================================

-- notifications: General inbox
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('tournament_alert', 'match_reminder', 'fee_reminder', 'attendance_alert', 'session_update', 'trial_confirmation', 'birthday_wish', 'achievement_certificate', 'performance_report', 'emergency_announcement')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' NOT NULL CHECK (status IN ('unread', 'read')),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'push')),
    is_read BOOLEAN DEFAULT false NOT NULL,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- whatsapp_templates: Meta message templates
CREATE TABLE public.whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('trial_booking', 'attendance', 'fee_reminder', 'payment_confirmation', 'tournament_announcement', 'performance_report')),
    name TEXT UNIQUE NOT NULL,
    language TEXT DEFAULT 'en' NOT NULL,
    body_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- whatsapp_queue: Message retry pipeline
CREATE TABLE public.whatsapp_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_phone TEXT NOT NULL,
    template_name TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0 NOT NULL,
    max_retries INTEGER DEFAULT 3 NOT NULL,
    error_message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- whatsapp_message_logs: Message statuses logs
CREATE TABLE public.whatsapp_message_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_queue_id UUID REFERENCES public.whatsapp_queue(id) ON DELETE SET NULL,
    recipient_phone TEXT NOT NULL,
    message_sid TEXT UNIQUE,
    message_text TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
    error_details TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- email_templates: Send layouts catalog
CREATE TABLE public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- email_queue: SMTP messages pipeline
CREATE TABLE public.email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    template_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0 NOT NULL,
    max_retries INTEGER DEFAULT 3 NOT NULL,
    error_message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- email_logs: Delivery logging
CREATE TABLE public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),
    error_details TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- notification_preferences: User toggles
CREATE TABLE public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true NOT NULL,
    whatsapp_enabled BOOLEAN DEFAULT true NOT NULL,
    push_enabled BOOLEAN DEFAULT true NOT NULL,
    marketing_emails BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================================================
-- 6. HEALTH, AUDITING & ANALYTICS
-- ==========================================================================

-- attendance_reports: Presence percentage summary
CREATE TABLE public.attendance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    total_sessions INTEGER NOT NULL,
    present_sessions INTEGER NOT NULL,
    absent_sessions INTEGER NOT NULL,
    excused_sessions INTEGER NOT NULL,
    percentage NUMERIC NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(player_id, month)
);

-- analytics: Metrics timeline records
CREATE TABLE public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sport_type TEXT NOT NULL CHECK (sport_type IN ('cricket', 'baseball')),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- player_statistics: Averages tracking sheet
CREATE TABLE public.player_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sport_type TEXT NOT NULL CHECK (sport_type IN ('cricket', 'baseball')),
    matches_played INTEGER DEFAULT 0 NOT NULL,
    runs_scored INTEGER DEFAULT 0,
    batting_average NUMERIC DEFAULT 0,
    high_score INTEGER DEFAULT 0,
    strike_rate NUMERIC DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,
    bowling_average NUMERIC DEFAULT 0,
    best_bowling TEXT,
    economy_rate NUMERIC DEFAULT 0,
    pitching_era NUMERIC DEFAULT 0,
    pitching_strikeouts INTEGER DEFAULT 0,
    pitching_innings NUMERIC DEFAULT 0,
    catches INTEGER DEFAULT 0,
    run_outs INTEGER DEFAULT 0,
    stumpings INTEGER DEFAULT 0,
    season TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- coach_feedback: Goals lists
CREATE TABLE public.coach_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    feedback TEXT NOT NULL,
    goals_set TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    goals_completed INTEGER[] DEFAULT '{}'::INTEGER[] NOT NULL,
    report_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- booking_locks: Trial bookings locks for concurrency control
CREATE TABLE public.booking_locks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_date DATE NOT NULL,
    booking_slot TEXT NOT NULL,
    session_id TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- audit_logs: Administrative actions trackers
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role TEXT CHECK (role IN ('admin', 'coach', 'player', 'parent', 'system', 'anonymous')),
    action TEXT NOT NULL,
    old_value JSONB DEFAULT '{}'::jsonb,
    new_value JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- error_logs: Site diagnostic stack traces
CREATE TABLE public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    severity TEXT DEFAULT 'error' NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'fatal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================================================
-- 7. TIMESTAMPS BIND TRIGGERS
-- ==========================================================================
CREATE TRIGGER update_website_config_updated_at BEFORE UPDATE ON public.website_config FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_parent_student_relations_updated_at BEFORE UPDATE ON public.parent_student_relations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_coach_student_relations_updated_at BEFORE UPDATE ON public.coach_student_relations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_trial_bookings_updated_at BEFORE UPDATE ON public.trial_bookings FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_mlb_programs_updated_at BEFORE UPDATE ON public.mlb_programs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON public.fixtures FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_shop_orders_updated_at BEFORE UPDATE ON public.shop_orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_performance_reports_updated_at BEFORE UPDATE ON public.performance_reports FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_session_plans_updated_at BEFORE UPDATE ON public.session_plans FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON public.payment_history FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_whatsapp_queue_updated_at BEFORE UPDATE ON public.whatsapp_queue FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_whatsapp_message_logs_updated_at BEFORE UPDATE ON public.whatsapp_message_logs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON public.email_queue FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON public.email_logs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_attendance_reports_updated_at BEFORE UPDATE ON public.attendance_reports FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_player_statistics_updated_at BEFORE UPDATE ON public.player_statistics FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_coach_feedback_updated_at BEFORE UPDATE ON public.coach_feedback FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_booking_locks_updated_at BEFORE UPDATE ON public.booking_locks FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER update_error_logs_updated_at BEFORE UPDATE ON public.error_logs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


-- ==========================================================================
-- 8. QUERY SPEED OPTIMIZATION INDICES
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_trial_bookings_date ON public.trial_bookings(booking_date, booking_slot);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_email ON public.trial_bookings(email, phone);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_status ON public.trial_bookings(status);
CREATE INDEX IF NOT EXISTS idx_mlb_programs_status ON public.mlb_programs(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON public.tournaments(sport_type);
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_profile ON public.players(profile_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_tournament ON public.fixtures(tournament_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_teams ON public.fixtures(team_a_id, team_b_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_date ON public.fixtures(match_date);
CREATE INDEX IF NOT EXISTS idx_results_fixture ON public.results(fixture_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_parent_student_relations ON public.parent_student_relations(parent_id, player_id);
CREATE INDEX IF NOT EXISTS idx_coach_student_relations ON public.coach_student_relations(coach_id, player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player ON public.attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_performance_reports_player ON public.performance_reports(player_id, report_date);
CREATE INDEX IF NOT EXISTS idx_certificates_player ON public.certificates(player_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_coach ON public.session_plans(coach_id, date);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON public.announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_payment_history_player ON public.payment_history(player_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice ON public.payment_history(invoice_number);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON public.whatsapp_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_player ON public.shop_orders(player_id);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON public.registrations(tournament_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_code ON public.registrations(qr_pass_code);


-- ==========================================================================
-- 9. SECURITY ROLES & ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.website_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_student_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlb_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Security helper query functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'coach'
    ),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_assigned_coach(player_profile_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.coach_student_relations
      WHERE coach_id = public.current_user_profile_id() AND player_id = player_profile_id
    ),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_linked_parent(player_profile_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM public.parent_student_relations
      WHERE parent_id = public.current_user_profile_id() AND player_id = player_profile_id
    ),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- 9.1 RLS Policies: website_config
CREATE POLICY "website_config_select_policy" ON public.website_config FOR SELECT USING (true);
CREATE POLICY "website_config_all_policy" ON public.website_config FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.2 RLS Policies: profiles
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin() OR public.is_coach() OR public.is_linked_parent(id)
);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin() OR public.is_assigned_coach(id)
) WITH CHECK (
  user_id = auth.uid() OR public.is_admin() OR public.is_assigned_coach(id)
);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE USING (public.is_admin());

-- 9.3 RLS Policies: parent_student_relations
CREATE POLICY "parent_student_relations_select" ON public.parent_student_relations FOR SELECT USING (
  parent_id = public.current_user_profile_id() OR player_id = public.current_user_profile_id() OR public.is_admin()
);
CREATE POLICY "parent_student_relations_admin" ON public.parent_student_relations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.4 RLS Policies: coach_student_relations
CREATE POLICY "coach_student_relations_select" ON public.coach_student_relations FOR SELECT USING (
  coach_id = public.current_user_profile_id() OR player_id = public.current_user_profile_id() OR public.is_admin()
);
CREATE POLICY "coach_student_relations_admin" ON public.coach_student_relations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.5 RLS Policies: trial_bookings
CREATE POLICY "trial_bookings_select" ON public.trial_bookings FOR SELECT USING (true);
CREATE POLICY "trial_bookings_insert" ON public.trial_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "trial_bookings_update" ON public.trial_bookings FOR UPDATE USING (
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()) OR public.is_admin()
) WITH CHECK (
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "trial_bookings_delete" ON public.trial_bookings FOR DELETE USING (public.is_admin());

-- 9.6 RLS Policies: tournaments, teams, players, mlb_programs, fixtures, results (read public, write admin only)
CREATE POLICY "mlb_programs_select" ON public.mlb_programs FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "mlb_programs_admin" ON public.mlb_programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "tournaments_select" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_admin" ON public.tournaments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_admin" ON public.teams FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "players_select" ON public.players FOR SELECT USING (true);
CREATE POLICY "players_admin" ON public.players FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "fixtures_select" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "fixtures_admin" ON public.fixtures FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "results_select" ON public.results FOR SELECT USING (true);
CREATE POLICY "results_admin" ON public.results FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.7 RLS Policies: registrations (tournament signups)
CREATE POLICY "registrations_select" ON public.registrations FOR SELECT USING (
  contact_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "registrations_insert" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "registrations_admin" ON public.registrations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.8 RLS Policies: attendance
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_coach() OR public.is_admin()
);
CREATE POLICY "attendance_write" ON public.attendance FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

-- 9.9 RLS Policies: performance_reports & coach_feedback
CREATE POLICY "performance_reports_select" ON public.performance_reports FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_coach() OR public.is_admin()
);
CREATE POLICY "performance_reports_write" ON public.performance_reports FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

CREATE POLICY "coach_feedback_select" ON public.coach_feedback FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_coach() OR public.is_admin()
);
CREATE POLICY "coach_feedback_write" ON public.coach_feedback FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

-- 9.10 RLS Policies: certificates & session_plans
CREATE POLICY "certificates_select" ON public.certificates FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_coach() OR public.is_admin()
);
CREATE POLICY "certificates_write" ON public.certificates FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

CREATE POLICY "session_plans_select" ON public.session_plans FOR SELECT USING (true);
CREATE POLICY "session_plans_write" ON public.session_plans FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

-- 9.11 RLS Policies: announcements
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (
  target_role = 'all' OR target_role = public.current_user_role() OR public.is_admin() OR public.is_coach()
);
CREATE POLICY "announcements_write" ON public.announcements FOR ALL USING (
  public.is_admin() OR public.is_coach()
) WITH CHECK (
  public.is_admin() OR public.is_coach()
);

-- 9.12 RLS Policies: payment_history (fee invoices), payments, receipts, shop_orders
CREATE POLICY "payment_history_select" ON public.payment_history FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_admin()
);
CREATE POLICY "payment_history_write" ON public.payment_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (
  user_id = public.current_user_profile_id() OR public.is_admin()
);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (
  user_id = public.current_user_profile_id() OR auth.uid() IS NULL -- Webhook/Razorpay signature checks
);
CREATE POLICY "payments_admin" ON public.payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "receipts_select" ON public.receipts FOR SELECT USING (
  payment_id IN (SELECT id FROM public.payments WHERE user_id = public.current_user_profile_id()) OR public.is_admin()
);
CREATE POLICY "receipts_admin" ON public.receipts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "shop_orders_select" ON public.shop_orders FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_admin()
);
CREATE POLICY "shop_orders_insert" ON public.shop_orders FOR INSERT WITH CHECK (
  player_id = public.current_user_profile_id()
);
CREATE POLICY "shop_orders_admin" ON public.shop_orders FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9.13 RLS Policies: notifications & preferences
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (
  user_id = public.current_user_profile_id() OR public.is_linked_parent(user_id) OR public.is_admin()
);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (
  public.is_admin() OR public.is_coach() OR user_id = public.current_user_profile_id()
);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (
  user_id = public.current_user_profile_id() OR public.is_admin()
) WITH CHECK (
  user_id = public.current_user_profile_id() OR public.is_admin()
);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (public.is_admin());

CREATE POLICY "notification_preferences_select" ON public.notification_preferences FOR SELECT USING (
  user_id = public.current_user_profile_id() OR public.is_admin()
);
CREATE POLICY "notification_preferences_write" ON public.notification_preferences FOR ALL USING (
  user_id = public.current_user_profile_id() OR public.is_admin()
) WITH CHECK (
  user_id = public.current_user_profile_id() OR public.is_admin()
);

-- 9.14 RLS Policies: attendance_reports, analytics, player_statistics
CREATE POLICY "attendance_reports_select" ON public.attendance_reports FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_coach() OR public.is_admin()
);
CREATE POLICY "attendance_reports_write" ON public.attendance_reports FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

CREATE POLICY "analytics_select" ON public.analytics FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_coach() OR public.is_admin()
);
CREATE POLICY "analytics_write" ON public.analytics FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

CREATE POLICY "player_statistics_select" ON public.player_statistics FOR SELECT USING (
  player_id = public.current_user_profile_id() OR public.is_linked_parent(player_id) OR public.is_coach() OR public.is_admin()
);
CREATE POLICY "player_statistics_write" ON public.player_statistics FOR ALL USING (
  public.is_coach() OR public.is_admin()
) WITH CHECK (
  public.is_coach() OR public.is_admin()
);

-- 9.15 RLS Policies: booking_locks
CREATE POLICY "booking_locks_select" ON public.booking_locks FOR SELECT USING (true);
CREATE POLICY "booking_locks_all" ON public.booking_locks FOR ALL USING (true) WITH CHECK (true);

-- 9.16 RLS Policies: audit_logs & error_logs (read admin only, write anyone)
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "error_logs_select" ON public.error_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "error_logs_insert" ON public.error_logs FOR INSERT WITH CHECK (true);

-- 9.17 RLS Policies: WhatsApp & Email queues/logs (read/write system/admin only)
CREATE POLICY "whatsapp_templates_all" ON public.whatsapp_templates FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "whatsapp_queue_all" ON public.whatsapp_queue FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "whatsapp_message_logs_all" ON public.whatsapp_message_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "email_templates_all" ON public.email_templates FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "email_queue_all" ON public.email_queue FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "email_logs_all" ON public.email_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Grant access on all tables to roles
GRANT ALL ON public.website_config TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.parent_student_relations TO anon, authenticated, service_role;
GRANT ALL ON public.coach_student_relations TO anon, authenticated, service_role;
GRANT ALL ON public.trial_bookings TO anon, authenticated, service_role;
GRANT ALL ON public.mlb_programs TO anon, authenticated, service_role;
GRANT ALL ON public.tournaments TO anon, authenticated, service_role;
GRANT ALL ON public.teams TO anon, authenticated, service_role;
GRANT ALL ON public.players TO anon, authenticated, service_role;
GRANT ALL ON public.fixtures TO anon, authenticated, service_role;
GRANT ALL ON public.results TO anon, authenticated, service_role;
GRANT ALL ON public.payments TO anon, authenticated, service_role;
GRANT ALL ON public.receipts TO anon, authenticated, service_role;
GRANT ALL ON public.shop_orders TO anon, authenticated, service_role;
GRANT ALL ON public.registrations TO anon, authenticated, service_role;
GRANT ALL ON public.attendance TO anon, authenticated, service_role;
GRANT ALL ON public.performance_reports TO anon, authenticated, service_role;
GRANT ALL ON public.certificates TO anon, authenticated, service_role;
GRANT ALL ON public.session_plans TO anon, authenticated, service_role;
GRANT ALL ON public.announcements TO anon, authenticated, service_role;
GRANT ALL ON public.payment_history TO anon, authenticated, service_role;
GRANT ALL ON public.notifications TO anon, authenticated, service_role;
GRANT ALL ON public.whatsapp_templates TO anon, authenticated, service_role;
GRANT ALL ON public.whatsapp_queue TO anon, authenticated, service_role;
GRANT ALL ON public.whatsapp_message_logs TO anon, authenticated, service_role;
GRANT ALL ON public.email_templates TO anon, authenticated, service_role;
GRANT ALL ON public.email_queue TO anon, authenticated, service_role;
GRANT ALL ON public.email_logs TO anon, authenticated, service_role;
GRANT ALL ON public.notification_preferences TO anon, authenticated, service_role;
GRANT ALL ON public.attendance_reports TO anon, authenticated, service_role;
GRANT ALL ON public.analytics TO anon, authenticated, service_role;
GRANT ALL ON public.player_statistics TO anon, authenticated, service_role;
GRANT ALL ON public.coach_feedback TO anon, authenticated, service_role;
GRANT ALL ON public.booking_locks TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;
GRANT ALL ON public.error_logs TO anon, authenticated, service_role;


-- ==========================================================================
-- 10. SYSTEM NOTIFICATION QUEUE DISPATCH AUTOMATION (WHATSAPP & EMAIL PREP)
-- ==========================================================================

-- Helper function to queue notification records directly
CREATE OR REPLACE FUNCTION public.queue_whatsapp_notification(
  p_recipient_phone TEXT,
  p_template_name TEXT,
  p_variables JSONB
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO public.whatsapp_queue (recipient_phone, template_name, variables, status)
  VALUES (p_recipient_phone, p_template_name, p_variables, 'pending')
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.queue_email_notification(
  p_recipient_email TEXT,
  p_template_name TEXT,
  p_subject TEXT,
  p_variables JSONB
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO public.email_queue (recipient_email, template_name, subject, variables, status)
  VALUES (p_recipient_email, p_template_name, p_subject, p_variables, 'pending')
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE sql SECURITY DEFINER;


-- 10.1 Trigger: Auto queue trial booking notifications
CREATE OR REPLACE FUNCTION public.trigger_trial_booking_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- WhatsApp Queue
  PERFORM public.queue_whatsapp_notification(
    NEW.phone,
    'trial_confirmation',
    jsonb_build_object(
      'name', NEW.name,
      'date', NEW.booking_date::text,
      'slot', NEW.booking_slot
    )
  );

  -- Email Queue
  PERFORM public.queue_email_notification(
    NEW.email,
    'trial_confirmation',
    'Free Trial Session Confirmed - Renegades Sports Arena',
    jsonb_build_object(
      'name', NEW.name,
      'date', NEW.booking_date::text,
      'slot', NEW.booking_slot
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE TRIGGER on_trial_booking_inserted
  AFTER INSERT ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_trial_booking_whatsapp();


-- 10.2 Trigger: Auto queue attendance alerts (when Absent)
CREATE OR REPLACE FUNCTION public.trigger_attendance_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_player_name TEXT;
  v_recipient_phone TEXT;
  v_recipient_email TEXT;
BEGIN
  IF NEW.status = 'Absent' THEN
    -- Get player details
    SELECT name, phone, email INTO v_player_name, v_recipient_phone, v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
    
    -- Try to get parent's details
    SELECT p.phone, p.email INTO v_recipient_phone, v_recipient_email
    FROM public.parent_student_relations psr
    JOIN public.profiles p ON psr.parent_id = p.id
    WHERE psr.player_id = NEW.player_id
    LIMIT 1;
    
    -- Fallback to player phone/email if parent not found
    IF v_recipient_phone IS NULL THEN
      SELECT phone INTO v_recipient_phone FROM public.profiles WHERE id = NEW.player_id;
    END IF;
    IF v_recipient_email IS NULL THEN
      SELECT email INTO v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
    END IF;
    
    -- Queue WhatsApp
    IF v_recipient_phone IS NOT NULL THEN
      PERFORM public.queue_whatsapp_notification(
        v_recipient_phone,
        'attendance_alert',
        jsonb_build_object(
          'student_name', v_player_name,
          'date', NEW.date::text
        )
      );
    END IF;

    -- Queue Email
    IF v_recipient_email IS NOT NULL THEN
      PERFORM public.queue_email_notification(
        v_recipient_email,
        'attendance_alert',
        'Attendance Notification: Absent - Renegades Sports Arena',
        jsonb_build_object(
          'student_name', v_player_name,
          'date', NEW.date::text
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE TRIGGER on_attendance_inserted
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_attendance_whatsapp();


-- 10.3 Trigger: Auto queue fee reminder
CREATE OR REPLACE FUNCTION public.trigger_fee_reminder_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_player_name TEXT;
  v_recipient_phone TEXT;
  v_recipient_email TEXT;
BEGIN
  IF NEW.status IN ('pending', 'overdue') THEN
    -- Get player details
    SELECT name, phone, email INTO v_player_name, v_recipient_phone, v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
    
    -- Try to get parent's details
    SELECT p.phone, p.email INTO v_recipient_phone, v_recipient_email
    FROM public.parent_student_relations psr
    JOIN public.profiles p ON psr.parent_id = p.id
    WHERE psr.player_id = NEW.player_id
    LIMIT 1;
    
    -- Fallback
    IF v_recipient_phone IS NULL THEN
      SELECT phone INTO v_recipient_phone FROM public.profiles WHERE id = NEW.player_id;
    END IF;
    IF v_recipient_email IS NULL THEN
      SELECT email INTO v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
    END IF;
    
    -- Queue WhatsApp
    IF v_recipient_phone IS NOT NULL THEN
      PERFORM public.queue_whatsapp_notification(
        v_recipient_phone,
        'fee_reminder',
        jsonb_build_object(
          'student_name', v_player_name,
          'amount', NEW.amount::text,
          'due_date', NEW.due_date::text,
          'invoice', NEW.invoice_number
        )
      );
    END IF;

    -- Queue Email
    IF v_recipient_email IS NOT NULL THEN
      PERFORM public.queue_email_notification(
        v_recipient_email,
        'fee_reminder',
        'Fee Outstanding Reminder - Renegades Sports Arena',
        jsonb_build_object(
          'student_name', v_player_name,
          'amount', NEW.amount::text,
          'due_date', NEW.due_date::text,
          'invoice', NEW.invoice_number
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE TRIGGER on_payment_history_inserted
  AFTER INSERT ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_fee_reminder_whatsapp();


-- 10.4 Trigger: Auto queue payment confirmation
CREATE OR REPLACE FUNCTION public.trigger_payment_confirmation_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_player_name TEXT;
  v_recipient_phone TEXT;
  v_recipient_email TEXT;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Get player details
    SELECT name, phone, email INTO v_player_name, v_recipient_phone, v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
    
    -- Try to get parent's details
    SELECT p.phone, p.email INTO v_recipient_phone, v_recipient_email
    FROM public.parent_student_relations psr
    JOIN public.profiles p ON psr.parent_id = p.id
    WHERE psr.player_id = NEW.player_id
    LIMIT 1;
    
    -- Fallback
    IF v_recipient_phone IS NULL THEN
      SELECT phone INTO v_recipient_phone FROM public.profiles WHERE id = NEW.player_id;
    END IF;
    IF v_recipient_email IS NULL THEN
      SELECT email INTO v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
    END IF;
    
    -- Queue WhatsApp
    IF v_recipient_phone IS NOT NULL THEN
      PERFORM public.queue_whatsapp_notification(
        v_recipient_phone,
        'payment_confirmation',
        jsonb_build_object(
          'name', v_player_name,
          'amount', NEW.amount::text,
          'invoice', NEW.invoice_number
        )
      );
    END IF;

    -- Queue Email
    IF v_recipient_email IS NOT NULL THEN
      PERFORM public.queue_email_notification(
        v_recipient_email,
        'payment_confirmation',
        'Receipt Confirmed: Payment Acknowledged - Renegades Sports Arena',
        jsonb_build_object(
          'name', v_player_name,
          'amount', NEW.amount::text,
          'invoice', NEW.invoice_number
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE TRIGGER on_payment_history_updated
  AFTER UPDATE OF status ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_payment_confirmation_whatsapp();


-- 10.5 Trigger: Broadcast Announcements notifications
CREATE OR REPLACE FUNCTION public.trigger_announcement_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue WhatsApp for all matching targets
  INSERT INTO public.whatsapp_queue (recipient_phone, template_name, variables, status)
  SELECT phone, 'announcement_broadcast', jsonb_build_object('title', NEW.title, 'message', NEW.content), 'pending'
  FROM public.profiles
  WHERE (NEW.target_role = 'all' OR role = NEW.target_role) AND phone IS NOT NULL;

  -- Queue Email for all matching targets
  INSERT INTO public.email_queue (recipient_email, template_name, subject, variables, status)
  SELECT email, 'announcement_broadcast', NEW.title, jsonb_build_object('title', NEW.title, 'message', NEW.content), 'pending'
  FROM public.profiles
  WHERE (NEW.target_role = 'all' OR role = NEW.target_role) AND email IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE TRIGGER on_announcement_inserted
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_announcement_whatsapp();


-- 10.6 Trigger: Queue Performance Report notification
CREATE OR REPLACE FUNCTION public.trigger_performance_report_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_player_name TEXT;
  v_recipient_phone TEXT;
  v_recipient_email TEXT;
  v_avg_score NUMERIC;
BEGIN
  -- Get player details
  SELECT name, phone, email INTO v_player_name, v_recipient_phone, v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
  
  -- Try to get parent's details
  SELECT p.phone, p.email INTO v_recipient_phone, v_recipient_email
  FROM public.parent_student_relations psr
  JOIN public.profiles p ON psr.parent_id = p.id
  WHERE psr.player_id = NEW.player_id
  LIMIT 1;
  
  -- Fallback
  IF v_recipient_phone IS NULL THEN
    SELECT phone INTO v_recipient_phone FROM public.profiles WHERE id = NEW.player_id;
  END IF;
  IF v_recipient_email IS NULL THEN
    SELECT email INTO v_recipient_email FROM public.profiles WHERE id = NEW.player_id;
  END IF;
  
  v_avg_score := ((NEW.batting + NEW.bowling + NEW.fielding + NEW.fitness) / 4.0);
  
  -- Queue WhatsApp
  IF v_recipient_phone IS NOT NULL THEN
    PERFORM public.queue_whatsapp_notification(
      v_recipient_phone,
      'performance_report',
      jsonb_build_object(
        'student_name', v_player_name,
        'score', v_avg_score::text,
        'date', NEW.report_date::text
      )
    );
  END IF;

  -- Queue Email
  IF v_recipient_email IS NOT NULL THEN
    PERFORM public.queue_email_notification(
      v_recipient_email,
      'performance_report',
      'New Player Performance Report Card Issued - Renegades Sports Arena',
      jsonb_build_object(
        'student_name', v_player_name,
        'score', v_avg_score::text,
        'date', NEW.report_date::text
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE TRIGGER on_performance_report_inserted
  AFTER INSERT ON public.performance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_performance_report_whatsapp();


-- ==========================================================================
-- 11. WEBHOOK-READY PAYMENTS ARCHITECTURE (RAZORPAY GATEWAY PREP)
-- ==========================================================================

-- Trigger: Automatically verify references and issue receipts on payment capture
CREATE OR REPLACE FUNCTION public.handle_payment_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'captured' AND OLD.status != 'captured' THEN
    -- 1. Link & update Fee Invoices
    IF NEW.payment_type = 'membership_fee' THEN
      UPDATE public.payment_history
      SET status = 'paid', payment_id = NEW.id
      WHERE id = NEW.reference_id;
      
    -- 2. Link & update Tournament entries
    ELSIF NEW.payment_type = 'tournament_registration' THEN
      UPDATE public.registrations
      SET payment_status = 'paid', payment_id = NEW.id
      WHERE id = NEW.reference_id;
      
    -- 3. Link & update Shop purchases
    ELSIF NEW.payment_type = 'shop_purchase' THEN
      UPDATE public.shop_orders
      SET status = 'paid', payment_id = NEW.id
      WHERE id = NEW.reference_id;
    END IF;
    
    -- 4. Generate transaction receipt
    INSERT INTO public.receipts (payment_id, receipt_number, pdf_url)
    VALUES (
      NEW.id,
      'REC-' || to_char(now(), 'YYYYMMDD') || '-' || substring(md5(random()::text) from 1 for 6),
      NULL
    ) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_status_updated
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_status_update();


-- ==========================================================================
-- 12. AUTOMATED BACKEND ANALYTICS & COMPUTED CALCULATIONS
-- ==========================================================================

-- 12.1 Trigger: Auto calculate presence percentages
CREATE OR REPLACE FUNCTION public.calculate_player_attendance_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_player_id UUID;
  v_month DATE;
  v_total_sessions INT;
  v_present_sessions INT;
  v_absent_sessions INT;
  v_excused_sessions INT;
  v_percentage NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_player_id := OLD.player_id;
    v_month := date_trunc('month', OLD.date)::DATE;
  ELSE
    v_player_id := NEW.player_id;
    v_month := date_trunc('month', NEW.date)::DATE;
  END IF;

  -- Read attendance log counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'Present'),
    COUNT(*) FILTER (WHERE status = 'Absent'),
    COUNT(*) FILTER (WHERE status = 'Excused')
  INTO 
    v_total_sessions,
    v_present_sessions,
    v_absent_sessions,
    v_excused_sessions
  FROM public.attendance
  WHERE player_id = v_player_id AND date_trunc('month', date)::DATE = v_month;

  IF v_total_sessions > 0 THEN
    v_percentage := round((v_present_sessions::NUMERIC / v_total_sessions::NUMERIC) * 100.0, 1);
  ELSE
    v_percentage := 0.0;
  END IF;

  -- Re-upsert monthly summaries
  INSERT INTO public.attendance_reports (player_id, month, total_sessions, present_sessions, absent_sessions, excused_sessions, percentage, created_at, updated_at)
  VALUES (v_player_id, v_month, v_total_sessions, v_present_sessions, v_absent_sessions, v_excused_sessions, v_percentage, now(), now())
  ON CONFLICT (player_id, month) DO UPDATE
  SET 
    total_sessions = EXCLUDED.total_sessions,
    present_sessions = EXCLUDED.present_sessions,
    absent_sessions = EXCLUDED.absent_sessions,
    excused_sessions = EXCLUDED.excused_sessions,
    percentage = EXCLUDED.percentage,
    updated_at = now();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_attendance_change
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_player_attendance_stats();


-- 12.2 Trigger: Fitness timeline updates
CREATE OR REPLACE FUNCTION public.calculate_player_fitness_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.analytics (player_id, sport_type, metric_name, metric_value, timestamp)
  VALUES (
    NEW.player_id,
    'cricket',
    'fitness_score',
    NEW.fitness::NUMERIC,
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_performance_report_change
  AFTER INSERT OR UPDATE ON public.performance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_player_fitness_stats();


-- ==========================================================================
-- 13. TRANSACTIONAL STORED PROCEDURES (CONSISTENCY ROLLBACK CONTROLS)
-- ==========================================================================

-- Stored Procedure: Submit Coach Evaluation inside a single database transaction
CREATE OR REPLACE FUNCTION public.submit_coach_evaluation(
  p_player_id UUID,
  p_coach_id UUID,
  p_batting INTEGER,
  p_bowling INTEGER,
  p_fielding INTEGER,
  p_fitness INTEGER,
  p_feedback TEXT,
  p_report_date DATE,
  p_sport_type TEXT,
  p_season TEXT,
  p_cricket_matches INTEGER,
  p_cricket_runs INTEGER,
  p_cricket_wickets INTEGER,
  p_cricket_econ NUMERIC,
  p_baseball_matches INTEGER,
  p_baseball_hits INTEGER,
  p_baseball_innings NUMERIC,
  p_baseball_era NUMERIC,
  p_new_goal TEXT
) RETURNS VOID AS $$
DECLARE
  v_eval_avg NUMERIC;
  v_report_id UUID;
  v_stats_id UUID;
  v_feedback_id UUID;
BEGIN
  -- Find existing performance report ID for this player on this date
  SELECT id INTO v_report_id 
  FROM public.performance_reports 
  WHERE player_id = p_player_id AND report_date = p_report_date 
  LIMIT 1;

  -- 1. Save general performance evaluation
  IF v_report_id IS NOT NULL THEN
    UPDATE public.performance_reports
    SET 
      batting = p_batting,
      bowling = p_bowling,
      fielding = p_fielding,
      fitness = p_fitness,
      feedback = p_feedback,
      coach_id = p_coach_id,
      updated_at = now()
    WHERE id = v_report_id;
  ELSE
    INSERT INTO public.performance_reports (player_id, coach_id, batting, bowling, fielding, fitness, feedback, report_date, created_at, updated_at)
    VALUES (p_player_id, p_coach_id, p_batting, p_bowling, p_fielding, p_fitness, p_feedback, p_report_date, now(), now());
  END IF;

  -- Find existing player statistics ID for this player, sport, and season
  SELECT id INTO v_stats_id 
  FROM public.player_statistics 
  WHERE player_id = p_player_id AND sport_type = p_sport_type AND season = p_season 
  LIMIT 1;

  -- 2. Update sport specific stats profiles
  IF p_sport_type = 'cricket' THEN
    IF v_stats_id IS NOT NULL THEN
      UPDATE public.player_statistics
      SET
        matches_played = p_cricket_matches,
        runs_scored = p_cricket_runs,
        wickets_taken = p_cricket_wickets,
        economy_rate = p_cricket_econ,
        batting_average = CASE WHEN p_cricket_matches > 0 THEN round(p_cricket_runs::NUMERIC / p_cricket_matches::NUMERIC, 1) ELSE 0 END,
        bowling_average = CASE WHEN p_cricket_wickets > 0 THEN round((p_cricket_econ * p_cricket_matches)::NUMERIC / p_cricket_wickets::NUMERIC, 1) ELSE 0 END,
        updated_at = now()
      WHERE id = v_stats_id;
    ELSE
      INSERT INTO public.player_statistics (
        player_id, sport_type, matches_played, runs_scored, wickets_taken, economy_rate, 
        batting_average, bowling_average, season, created_at, updated_at
      )
      VALUES (
        p_player_id, 'cricket', p_cricket_matches, p_cricket_runs, p_cricket_wickets, p_cricket_econ,
        CASE WHEN p_cricket_matches > 0 THEN round(p_cricket_runs::NUMERIC / p_cricket_matches::NUMERIC, 1) ELSE 0 END,
        CASE WHEN p_cricket_wickets > 0 THEN round((p_cricket_econ * p_cricket_matches)::NUMERIC / p_cricket_wickets::NUMERIC, 1) ELSE 0 END,
        p_season, now(), now()
      );
    END IF;
  ELSE
    -- Baseball stats updates
    IF v_stats_id IS NOT NULL THEN
      UPDATE public.player_statistics
      SET
        matches_played = p_baseball_matches,
        runs_scored = round(p_baseball_hits / 1.5),
        pitching_innings = p_baseball_innings,
        pitching_era = p_baseball_era,
        batting_average = CASE WHEN p_baseball_matches > 0 THEN round(p_baseball_hits::NUMERIC / (p_baseball_matches * 4.0), 3) ELSE 0 END,
        pitching_strikeouts = round(p_baseball_innings * 1.2),
        updated_at = now()
      WHERE id = v_stats_id;
    ELSE
      INSERT INTO public.player_statistics (
        player_id, sport_type, matches_played, runs_scored, pitching_innings, pitching_era, 
        batting_average, pitching_strikeouts, season, created_at, updated_at
      )
      VALUES (
        p_player_id, 'baseball', p_baseball_matches, round(p_baseball_hits / 1.5), p_baseball_innings, p_baseball_era,
        CASE WHEN p_baseball_matches > 0 THEN round(p_baseball_hits::NUMERIC / (p_baseball_matches * 4.0), 3) ELSE 0 END,
        round(p_baseball_innings * 1.2), p_season, now(), now()
      );
    END IF;
  END IF;

  -- Find existing coach feedback ID for this player
  SELECT id INTO v_feedback_id 
  FROM public.coach_feedback 
  WHERE player_id = p_player_id 
  LIMIT 1;

  -- 3. Save Coach goals & recommendations
  IF p_new_goal IS NOT NULL AND p_new_goal != '' THEN
    IF v_feedback_id IS NOT NULL THEN
      UPDATE public.coach_feedback
      SET 
        feedback = p_feedback,
        goals_set = CASE 
          WHEN NOT (goals_set @> ARRAY[p_new_goal]) THEN array_append(goals_set, p_new_goal) 
          ELSE goals_set 
        END,
        report_date = p_report_date,
        updated_at = now()
      WHERE id = v_feedback_id;
    ELSE
      INSERT INTO public.coach_feedback (player_id, coach_id, topic, feedback, goals_set, goals_completed, report_date, created_at, updated_at)
      VALUES (p_player_id, p_coach_id, 'General Performance', p_feedback, ARRAY[p_new_goal], '{}'::INTEGER[], p_report_date, now(), now());
    END IF;
  ELSE
    IF v_feedback_id IS NOT NULL THEN
      UPDATE public.coach_feedback
      SET 
        feedback = p_feedback,
        report_date = p_report_date,
        updated_at = now()
      WHERE id = v_feedback_id;
    END IF;
  END IF;

  -- 4. Log computed evaluations metrics to timelines analytics
  v_eval_avg := round((p_batting + p_bowling + p_fielding + p_fitness) / 4.0, 1);
  INSERT INTO public.analytics (player_id, sport_type, metric_name, metric_value, timestamp, created_at, updated_at)
  VALUES (p_player_id, p_sport_type, 'overall_evaluation', v_eval_avg, now(), now(), now());

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Stored Procedure: Atomic trial booking scheduler with locks verification
CREATE OR REPLACE FUNCTION public.create_trial_booking(
  p_name TEXT,
  p_age INTEGER,
  p_parent_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_skill_level TEXT,
  p_message TEXT,
  p_booking_date DATE,
  p_booking_slot TEXT,
  p_session_id TEXT
) RETURNS public.trial_bookings AS $$
DECLARE
  v_booking public.trial_bookings;
  v_slot_count INTEGER;
BEGIN
  -- 1. Check capacity counts (Max 5 per slot)
  SELECT COUNT(*) INTO v_slot_count 
  FROM public.trial_bookings 
  WHERE booking_date = p_booking_date AND booking_slot = p_booking_slot AND status != 'cancelled' AND status != 'rejected';
  
  IF v_slot_count >= 5 THEN
    RAISE EXCEPTION 'Slot holds maximum participants capacity limit.';
  END IF;

  -- 2. Insert booking
  INSERT INTO public.trial_bookings (
    name, age, parent_name, phone, email, skill_level, message, booking_date, booking_slot, status, created_at, updated_at
  )
  VALUES (
    p_name, p_age, p_parent_name, p_phone, p_email, p_skill_level, p_message, p_booking_date, p_booking_slot, 'pending', now(), now()
  )
  RETURNING * INTO v_booking;

  -- 3. Release lock for session
  DELETE FROM public.booking_locks WHERE session_id = p_session_id;

  -- 4. Create Audit Log
  INSERT INTO public.audit_logs (user_id, role, action, new_value, created_at, updated_at)
  VALUES (
    NULL,
    'anonymous',
    'create_trial_booking',
    jsonb_build_object('booking_id', v_booking.id, 'booking_date', p_booking_date, 'booking_slot', p_booking_slot),
    now(),
    now()
  );

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Stored Procedure: Submit Fixture Scoring inside a single database transaction
CREATE OR REPLACE FUNCTION public.submit_fixture_scoring(
  p_fixture_id UUID,
  p_status TEXT,
  p_current_innings_status TEXT,
  p_cricket_runs_a INTEGER,
  p_cricket_wickets_a INTEGER,
  p_cricket_overs_a NUMERIC,
  p_cricket_runs_b INTEGER,
  p_cricket_wickets_b INTEGER,
  p_cricket_overs_b NUMERIC,
  p_baseball_innings INTEGER,
  p_baseball_runs_a INTEGER,
  p_baseball_hits_a INTEGER,
  p_baseball_errors_a INTEGER,
  p_baseball_runs_b INTEGER,
  p_baseball_hits_b INTEGER,
  p_baseball_errors_b INTEGER,
  p_winner_id UUID,
  p_score_details TEXT,
  p_mvp_player TEXT,
  p_awards_details TEXT,
  p_photo_url TEXT
) RETURNS VOID AS $$
BEGIN
  -- 1. Update fixture scores
  UPDATE public.fixtures
  SET
    status = p_status,
    current_innings_status = p_current_innings_status,
    cricket_runs_a = p_cricket_runs_a,
    cricket_wickets_a = p_cricket_wickets_a,
    cricket_overs_a = p_cricket_overs_a,
    cricket_runs_b = p_cricket_runs_b,
    cricket_wickets_b = p_cricket_wickets_b,
    cricket_overs_b = p_cricket_overs_b,
    baseball_innings = p_baseball_innings,
    baseball_runs_a = p_baseball_runs_a,
    baseball_hits_a = p_baseball_hits_a,
    baseball_errors_a = p_baseball_errors_a,
    baseball_runs_b = p_baseball_runs_b,
    baseball_hits_b = p_baseball_hits_b,
    baseball_errors_b = p_baseball_errors_b,
    updated_at = now()
  WHERE id = p_fixture_id;

  -- 2. If status is Completed, save results
  IF p_status = 'completed' THEN
    INSERT INTO public.results (fixture_id, winner_id, score_details, mvp_player, awards_details, photo_url, created_at, updated_at)
    VALUES (p_fixture_id, p_winner_id, p_score_details, p_mvp_player, p_awards_details, p_photo_url, now(), now())
    ON CONFLICT (fixture_id) DO UPDATE
    SET
      winner_id = EXCLUDED.winner_id,
      score_details = EXCLUDED.score_details,
      mvp_player = EXCLUDED.mvp_player,
      awards_details = EXCLUDED.awards_details,
      photo_url = EXCLUDED.photo_url,
      updated_at = now();
  ELSE
    -- If status changed back from completed, remove results record if any
    DELETE FROM public.results WHERE fixture_id = p_fixture_id;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================================
-- 14. AUTH FALLBACK INTEGRITY PROFILES SYNC
-- ==========================================================================

-- Trigger to automatically populate profiles on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
  )
  ON CONFLICT (email) DO UPDATE
  SET user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================================================
-- 15. STORAGE MANAGEMENT SYSTEM SETUP
-- ==========================================================================

-- Insert and define buckets structure configs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('certificates', 'certificates', true, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('performance-reports', 'performance-reports', false, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain'])
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public, 
    file_size_limit = EXCLUDED.file_size_limit, 
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Re-enable RLS on storage objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up existing storage policies
DROP POLICY IF EXISTS "Allow public read access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access on avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access on avatars" ON storage.objects;

DROP POLICY IF EXISTS "storage_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_policy" ON storage.objects;

-- Create hardened storage access policies
CREATE POLICY "storage_select_policy" ON storage.objects FOR SELECT USING (
  bucket_id IN ('avatars', 'gallery', 'product-images', 'certificates') OR
  (bucket_id = 'performance-reports' AND (
    (storage.foldername(name))[1] = public.current_user_profile_id()::text OR
    public.is_linked_parent((storage.foldername(name))[1]::UUID) OR
    public.is_coach() OR
    public.is_admin()
  ))
);

CREATE POLICY "storage_insert_policy" ON storage.objects FOR INSERT WITH CHECK (
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = public.current_user_profile_id()::text) OR
  (bucket_id IN ('gallery', 'product-images') AND public.is_admin()) OR
  (bucket_id IN ('certificates', 'performance-reports') AND (public.is_coach() OR public.is_admin()))
);

CREATE POLICY "storage_update_policy" ON storage.objects FOR UPDATE USING (
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = public.current_user_profile_id()::text) OR
  (bucket_id IN ('gallery', 'product-images') AND public.is_admin()) OR
  (bucket_id IN ('certificates', 'performance-reports') AND (public.is_coach() OR public.is_admin()))
);

CREATE POLICY "storage_delete_policy" ON storage.objects FOR DELETE USING (
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = public.current_user_profile_id()::text) OR
  (bucket_id IN ('gallery', 'product-images') AND public.is_admin()) OR
  (bucket_id IN ('certificates', 'performance-reports') AND (public.is_coach() OR public.is_admin()))
);
