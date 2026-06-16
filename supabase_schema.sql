-- Renegades Sports Arena Trial Bookings Database Schema
-- Run this script in the Supabase SQL Editor to set up the booking table and anonymous access policies.

-- Drop the old table to ensure clean fields
DROP TABLE IF EXISTS public.trial_bookings;

-- Create the bookings table
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
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected', 'rescheduled', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trial_bookings ENABLE ROW LEVEL SECURITY;

-- Create Policies to grant client-side access using the anon key:

-- 1. Anyone can SELECT bookings (needed to calculate slot availability and display user-managed bookings)
CREATE POLICY "Enable SELECT for anonymous users" 
ON public.trial_bookings 
FOR SELECT 
USING (true);

-- 2. Anyone can INSERT bookings (needed to book a free trial)
CREATE POLICY "Enable INSERT for anonymous users" 
ON public.trial_bookings 
FOR INSERT 
WITH CHECK (true);

-- 3. Anyone can UPDATE bookings (needed for client-side rescheduling/cancellation and admin updates)
CREATE POLICY "Enable UPDATE for anonymous users" 
ON public.trial_bookings 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 4. Anyone can DELETE bookings (optional, if admins want to remove records)
CREATE POLICY "Enable DELETE for anonymous users" 
ON public.trial_bookings 
FOR DELETE 
USING (true);

-- Grant direct table access permissions to the anon & authenticated roles
GRANT ALL ON public.trial_bookings TO anon;
GRANT ALL ON public.trial_bookings TO authenticated;
GRANT ALL ON public.trial_bookings TO service_role;


-- ==========================================================================
-- RENEGADES SPORTS ARENA MULTI-SPORT EXTENSIONS (MLB & TOURNAMENTS)
-- ==========================================================================

-- Major League Baseball (MLB) Development Programs Table
CREATE TABLE IF NOT EXISTS public.mlb_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    age_group TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    icon TEXT DEFAULT '⚾' NOT NULL,
    image_url TEXT,
    coach_name TEXT,
    achievements TEXT,
    status TEXT DEFAULT 'published' NOT NULL, -- 'published', 'draft'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tournaments Table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL, -- 'Cricket', 'Baseball'
    age_category TEXT NOT NULL, -- 'U-11', 'U-13', 'U-15', 'U-17', 'Open Invitational'
    venue TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    poster_url TEXT,
    registration_status TEXT DEFAULT 'open' NOT NULL, -- 'open', 'closed', 'upcoming'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Players Table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    age INTEGER,
    role TEXT, -- e.g. 'Batsman', 'Pitcher'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fixtures Table
CREATE TABLE IF NOT EXISTS public.fixtures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_a_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    team_b_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' NOT NULL, -- 'scheduled', 'live', 'completed', 'cancelled'
    -- Scoring columns (unified for Cricket and Baseball)
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
    current_innings_status TEXT, -- e.g. 'Top of 3rd', 'Overs 14.2'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tournament Results / MVP table
CREATE TABLE IF NOT EXISTS public.results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE UNIQUE,
    winner_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    score_details TEXT,
    mvp_player TEXT,
    awards_details TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    registration_type TEXT NOT NULL, -- 'team', 'individual'
    registrant_name TEXT NOT NULL, -- Team name or Player name
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    age_category TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'paid'
    qr_pass_code TEXT DEFAULT gen_random_uuid()::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.mlb_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Grant SELECT/INSERT/UPDATE/DELETE access policies for anonymous keys

-- mlb_programs
CREATE POLICY "Enable SELECT for anonymous users" ON public.mlb_programs FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.mlb_programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.mlb_programs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.mlb_programs FOR DELETE USING (true);

-- tournaments
CREATE POLICY "Enable SELECT for anonymous users" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.tournaments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.tournaments FOR DELETE USING (true);

-- teams
CREATE POLICY "Enable SELECT for anonymous users" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.teams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.teams FOR DELETE USING (true);

-- players
CREATE POLICY "Enable SELECT for anonymous users" ON public.players FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.players FOR DELETE USING (true);

-- fixtures
CREATE POLICY "Enable SELECT for anonymous users" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.fixtures FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.fixtures FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.fixtures FOR DELETE USING (true);

-- results
CREATE POLICY "Enable SELECT for anonymous users" ON public.results FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.results FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.results FOR DELETE USING (true);

-- registrations
CREATE POLICY "Enable SELECT for anonymous users" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.registrations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.registrations FOR DELETE USING (true);

-- Grant direct table access permissions to roles
GRANT ALL ON public.mlb_programs TO anon, authenticated, service_role;
GRANT ALL ON public.tournaments TO anon, authenticated, service_role;
GRANT ALL ON public.teams TO anon, authenticated, service_role;
GRANT ALL ON public.players TO anon, authenticated, service_role;
GRANT ALL ON public.fixtures TO anon, authenticated, service_role;
GRANT ALL ON public.results TO anon, authenticated, service_role;
GRANT ALL ON public.registrations TO anon, authenticated, service_role;


-- ==========================================================================
-- USER DASHBOARDS & PORTAL EXTENSIONS
-- ==========================================================================

-- User Profiles Table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Links to auth.users.id if logged in via auth
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('player', 'parent', 'coach')),
    name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    bio TEXT,
    school TEXT,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Parent-Student Relationship Table
CREATE TABLE IF NOT EXISTS public.parent_student_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_id, student_id)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused')),
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, date)
);

-- Performance Reports Table
CREATE TABLE IF NOT EXISTS public.performance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    batting INTEGER DEFAULT 0 CHECK (batting BETWEEN 0 AND 10),
    bowling INTEGER DEFAULT 0 CHECK (bowling BETWEEN 0 AND 10),
    fielding INTEGER DEFAULT 0 CHECK (fielding BETWEEN 0 AND 10),
    fitness INTEGER DEFAULT 0 CHECK (fitness BETWEEN 0 AND 10),
    feedback TEXT,
    report_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Achievements / Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    badge_type TEXT NOT NULL, -- 'Gold', 'Silver', 'Bronze', 'Elite', 'Rookie'
    date_issued DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Coaching Session Plans Table
CREATE TABLE IF NOT EXISTS public.session_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    topic TEXT,
    drills TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Portal Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'player', 'parent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payment History Table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    billing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
    invoice_number TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Grant SELECT/INSERT/UPDATE/DELETE access policies for anonymous and authenticated users

-- profiles
CREATE POLICY "Enable SELECT for anonymous users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.profiles FOR DELETE USING (true);

-- parent_student_relations
CREATE POLICY "Enable SELECT for anonymous users" ON public.parent_student_relations FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.parent_student_relations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.parent_student_relations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.parent_student_relations FOR DELETE USING (true);

-- attendance
CREATE POLICY "Enable SELECT for anonymous users" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.attendance FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.attendance FOR DELETE USING (true);

-- performance_reports
CREATE POLICY "Enable SELECT for anonymous users" ON public.performance_reports FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.performance_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.performance_reports FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.performance_reports FOR DELETE USING (true);

-- certificates
CREATE POLICY "Enable SELECT for anonymous users" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.certificates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.certificates FOR DELETE USING (true);

-- session_plans
CREATE POLICY "Enable SELECT for anonymous users" ON public.session_plans FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.session_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.session_plans FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.session_plans FOR DELETE USING (true);

-- announcements
CREATE POLICY "Enable SELECT for anonymous users" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.announcements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.announcements FOR DELETE USING (true);

-- payment_history
CREATE POLICY "Enable SELECT for anonymous users" ON public.payment_history FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.payment_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.payment_history FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.payment_history FOR DELETE USING (true);

-- Grant direct table access permissions to roles
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.parent_student_relations TO anon, authenticated, service_role;
GRANT ALL ON public.attendance TO anon, authenticated, service_role;
GRANT ALL ON public.performance_reports TO anon, authenticated, service_role;
GRANT ALL ON public.certificates TO anon, authenticated, service_role;
GRANT ALL ON public.session_plans TO anon, authenticated, service_role;
GRANT ALL ON public.announcements TO anon, authenticated, service_role;
GRANT ALL ON public.payment_history TO anon, authenticated, service_role;


-- ==========================================================================
-- PERFORMANCE ANALYTICS & COMMUNICATION SYSTEM MODULES
-- ==========================================================================

-- Notifications Collection
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('tournament_alert', 'match_reminder', 'fee_reminder', 'attendance_alert', 'session_update', 'trial_confirmation', 'birthday_wish', 'achievement_certificate', 'performance_report', 'emergency_announcement')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' NOT NULL CHECK (status IN ('unread', 'read')),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'push')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attendance Reports Summary Collection
CREATE TABLE IF NOT EXISTS public.attendance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    total_sessions INTEGER NOT NULL,
    present_sessions INTEGER NOT NULL,
    absent_sessions INTEGER NOT NULL,
    excused_sessions INTEGER NOT NULL,
    percentage NUMERIC NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- General Analytics Timeline Metrics Collection
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sport_type TEXT NOT NULL CHECK (sport_type IN ('cricket', 'baseball')),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seasonal Player Statistics Collection
CREATE TABLE IF NOT EXISTS public.player_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Coach Feedback & Goal Setting Collection
CREATE TABLE IF NOT EXISTS public.coach_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    feedback TEXT NOT NULL,
    goals_set TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    goals_completed INTEGER[] DEFAULT '{}'::INTEGER[] NOT NULL,
    report_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;

-- Grant RLS policies (Anonymous + Authenticated access)
-- notifications
CREATE POLICY "Enable SELECT for anonymous users" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.notifications FOR DELETE USING (true);

-- attendance_reports
CREATE POLICY "Enable SELECT for anonymous users" ON public.attendance_reports FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.attendance_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.attendance_reports FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.attendance_reports FOR DELETE USING (true);

-- analytics
CREATE POLICY "Enable SELECT for anonymous users" ON public.analytics FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.analytics FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.analytics FOR DELETE USING (true);

-- player_statistics
CREATE POLICY "Enable SELECT for anonymous users" ON public.player_statistics FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.player_statistics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.player_statistics FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.player_statistics FOR DELETE USING (true);

-- coach_feedback
CREATE POLICY "Enable SELECT for anonymous users" ON public.coach_feedback FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.coach_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.coach_feedback FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.coach_feedback FOR DELETE USING (true);

-- Grant direct table access permissions to roles
GRANT ALL ON public.notifications TO anon, authenticated, service_role;
GRANT ALL ON public.attendance_reports TO anon, authenticated, service_role;
GRANT ALL ON public.analytics TO anon, authenticated, service_role;
GRANT ALL ON public.player_statistics TO anon, authenticated, service_role;
GRANT ALL ON public.coach_feedback TO anon, authenticated, service_role;


-- ==========================================================================
-- CONCURRENCY LOCKING & AUDITING SYSTEM MODULES
-- ==========================================================================

-- Booking locks table for concurrency control
CREATE TABLE IF NOT EXISTS public.booking_locks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_date DATE NOT NULL,
    booking_slot TEXT NOT NULL,
    session_id TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit logs table for tracking booking actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.trial_bookings(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'create', 'update_status', 'reschedule', 'cancel'
    actor TEXT NOT NULL, -- 'user', 'admin', 'system'
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.booking_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable SELECT/INSERT/UPDATE/DELETE access policies for anonymous and authenticated users
CREATE POLICY "Enable SELECT for anonymous users" ON public.booking_locks FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.booking_locks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.booking_locks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.booking_locks FOR DELETE USING (true);

CREATE POLICY "Enable SELECT for anonymous users" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for anonymous users" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for anonymous users" ON public.audit_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable DELETE for anonymous users" ON public.audit_logs FOR DELETE USING (true);

-- Grant direct table access permissions to roles
GRANT ALL ON public.booking_locks TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;



