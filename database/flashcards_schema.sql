-- ===============================================
-- EzA Flashcards Database Schema
-- FSRS-5 Algorithm Support + Advanced Features
-- ===============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- Flashcard Sets Table
-- ===============================================
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 200),
    description TEXT CHECK (LENGTH(description) <= 1000),
    subject TEXT,
    difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),
    language TEXT NOT NULL DEFAULT 'en',
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Statistics
    card_count INTEGER NOT NULL DEFAULT 0,
    mastery_level DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    total_study_time INTEGER NOT NULL DEFAULT 0, -- seconds
    last_studied TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- Flashcards Table (FSRS-5 Compatible)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    
    -- Card Content
    question TEXT NOT NULL CHECK (LENGTH(question) >= 1),
    answer TEXT NOT NULL CHECK (LENGTH(answer) >= 1),
    hint TEXT,
    explanation TEXT,
    card_type TEXT NOT NULL DEFAULT 'basic' CHECK (card_type IN ('basic', 'cloze', 'multiple_choice')),
    tags TEXT[] DEFAULT '{}',
    
    -- Media Support
    image_url TEXT,
    audio_url TEXT,
    
    -- FSRS-5 Core Algorithm Fields
    due TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    stability DECIMAL(10,6) NOT NULL DEFAULT 2.0,
    difficulty DECIMAL(10,6) NOT NULL DEFAULT 5.0,
    elapsed_days INTEGER NOT NULL DEFAULT 0,
    scheduled_days INTEGER NOT NULL DEFAULT 1,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    state INTEGER NOT NULL DEFAULT 0 CHECK (state IN (0, 1, 2, 3)), -- NEW, LEARNING, REVIEW, RELEARNING
    last_review TIMESTAMP WITH TIME ZONE,
    
    -- Learning Statistics
    total_time INTEGER NOT NULL DEFAULT 0, -- seconds spent on this card
    average_time DECIMAL(8,2) NOT NULL DEFAULT 0.0, -- average response time
    success_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0 CHECK (success_rate >= 0 AND success_rate <= 1),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- Review Sessions Table
-- ===============================================
CREATE TABLE IF NOT EXISTS public.review_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    
    -- Session Configuration
    mode TEXT NOT NULL CHECK (mode IN ('flashcard', 'learn', 'test', 'match', 'gravity', 'ai_tutor')),
    session_type TEXT NOT NULL DEFAULT 'review' CHECK (session_type IN ('review', 'learn', 'relearn', 'cram')),
    
    -- Session Statistics
    cards_reviewed INTEGER NOT NULL DEFAULT 0,
    cards_correct INTEGER NOT NULL DEFAULT 0,
    cards_incorrect INTEGER NOT NULL DEFAULT 0,
    total_time INTEGER NOT NULL DEFAULT 0, -- seconds
    accuracy DECIMAL(5,4) CHECK (accuracy >= 0 AND accuracy <= 1),
    
    -- Rating Distribution (FSRS)
    again_count INTEGER NOT NULL DEFAULT 0,
    hard_count INTEGER NOT NULL DEFAULT 0,
    good_count INTEGER NOT NULL DEFAULT 0,
    easy_count INTEGER NOT NULL DEFAULT 0,
    
    -- Session Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- Review Logs Table (Individual Card Reviews)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.review_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.review_sessions(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
    
    -- Review Details
    rating INTEGER NOT NULL CHECK (rating IN (1, 2, 3, 4)), -- AGAIN, HARD, GOOD, EASY
    response_time INTEGER NOT NULL DEFAULT 0, -- milliseconds
    previous_state INTEGER NOT NULL,
    new_state INTEGER NOT NULL,
    
    -- FSRS Fields at Time of Review
    previous_due TIMESTAMP WITH TIME ZONE NOT NULL,
    new_due TIMESTAMP WITH TIME ZONE NOT NULL,
    previous_stability DECIMAL(10,6) NOT NULL,
    new_stability DECIMAL(10,6) NOT NULL,
    previous_difficulty DECIMAL(10,6) NOT NULL,
    new_difficulty DECIMAL(10,6) NOT NULL,
    
    -- Metadata
    reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===============================================
-- FSRS Parameters Table (User-specific tuning)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.fsrs_parameters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE, -- NULL = global parameters
    
    -- FSRS-5 Parameters (17 weights)
    w0 DECIMAL(10,6) NOT NULL DEFAULT 0.5701,
    w1 DECIMAL(10,6) NOT NULL DEFAULT 1.4436,
    w2 DECIMAL(10,6) NOT NULL DEFAULT 4.1386,
    w3 DECIMAL(10,6) NOT NULL DEFAULT 10.9355,
    w4 DECIMAL(10,6) NOT NULL DEFAULT 5.1443,
    w5 DECIMAL(10,6) NOT NULL DEFAULT 1.2006,
    w6 DECIMAL(10,6) NOT NULL DEFAULT 0.8627,
    w7 DECIMAL(10,6) NOT NULL DEFAULT 0.0362,
    w8 DECIMAL(10,6) NOT NULL DEFAULT 1.629,
    w9 DECIMAL(10,6) NOT NULL DEFAULT 0.1342,
    w10 DECIMAL(10,6) NOT NULL DEFAULT 1.0166,
    w11 DECIMAL(10,6) NOT NULL DEFAULT 2.1174,
    w12 DECIMAL(10,6) NOT NULL DEFAULT 0.0839,
    w13 DECIMAL(10,6) NOT NULL DEFAULT 0.3204,
    w14 DECIMAL(10,6) NOT NULL DEFAULT 1.4676,
    w15 DECIMAL(10,6) NOT NULL DEFAULT 0.219,
    w16 DECIMAL(10,6) NOT NULL DEFAULT 2.8237,
    
    -- Algorithm Configuration
    request_retention DECIMAL(5,4) NOT NULL DEFAULT 0.9,
    maximum_interval INTEGER NOT NULL DEFAULT 36500, -- ~100 years
    easy_bonus DECIMAL(5,4) NOT NULL DEFAULT 1.3,
    hard_interval DECIMAL(5,4) NOT NULL DEFAULT 1.2,
    new_interval DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    graduating_interval INTEGER NOT NULL DEFAULT 1, -- days
    easy_interval INTEGER NOT NULL DEFAULT 4, -- days
    
    -- Learning Steps (in minutes)
    learning_steps INTEGER[] NOT NULL DEFAULT '{1, 10}',
    relearning_steps INTEGER[] NOT NULL DEFAULT '{10}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one parameter set per user per set
    UNIQUE(user_id, set_id)
);

-- ===============================================
-- Learning Statistics View
-- ===============================================
CREATE OR REPLACE VIEW public.learning_stats AS
SELECT 
    fs.user_id,
    fs.id as set_id,
    fs.title as set_title,
    fs.card_count,
    
    -- Card State Distribution
    COUNT(CASE WHEN f.state = 0 THEN 1 END) as new_cards,
    COUNT(CASE WHEN f.state = 1 THEN 1 END) as learning_cards,
    COUNT(CASE WHEN f.state = 2 THEN 1 END) as review_cards,
    COUNT(CASE WHEN f.state = 3 THEN 1 END) as relearning_cards,
    
    -- Due Cards
    COUNT(CASE WHEN f.due <= NOW() AND f.state IN (0,1,2,3) THEN 1 END) as due_cards,
    COUNT(CASE WHEN f.due <= NOW() + INTERVAL '1 day' AND f.state = 2 THEN 1 END) as due_tomorrow,
    
    -- Performance Metrics
    AVG(f.success_rate) as avg_success_rate,
    AVG(f.stability) as avg_stability,
    AVG(f.difficulty) as avg_difficulty,
    
    -- Study Time
    fs.total_study_time,
    fs.last_studied,
    fs.mastery_level
    
FROM public.flashcard_sets fs
LEFT JOIN public.flashcards f ON fs.id = f.set_id
GROUP BY fs.user_id, fs.id, fs.title, fs.card_count, fs.total_study_time, fs.last_studied, fs.mastery_level;

-- ===============================================
-- Indexes for Performance
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_visibility ON public.flashcard_sets(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_subject ON public.flashcard_sets(subject);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_tags ON public.flashcard_sets USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due ON public.flashcards(due);
CREATE INDEX IF NOT EXISTS idx_flashcards_state ON public.flashcards(state);
CREATE INDEX IF NOT EXISTS idx_flashcards_state_due ON public.flashcards(state, due);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON public.flashcards USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_review_sessions_user_id ON public.review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_set_id ON public.review_sessions(set_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_started_at ON public.review_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_review_logs_session_id ON public.review_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_card_id ON public.review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON public.review_logs(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_fsrs_parameters_user_id ON public.fsrs_parameters(user_id);

-- ===============================================
-- Row Level Security (RLS)
-- ===============================================
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_parameters ENABLE ROW LEVEL SECURITY;

-- Flashcard Sets Policies
CREATE POLICY "Users can view own and public flashcard sets" ON public.flashcard_sets
    FOR SELECT USING (
        auth.uid() = user_id OR 
        visibility = 'public'
    );

CREATE POLICY "Users can create own flashcard sets" ON public.flashcard_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard sets" ON public.flashcard_sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard sets" ON public.flashcard_sets
    FOR DELETE USING (auth.uid() = user_id);

-- Flashcards Policies  
CREATE POLICY "Users can view flashcards from accessible sets" ON public.flashcards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets fs 
            WHERE fs.id = flashcards.set_id 
            AND (fs.user_id = auth.uid() OR fs.visibility = 'public')
        )
    );

CREATE POLICY "Users can create flashcards in own sets" ON public.flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets fs 
            WHERE fs.id = flashcards.set_id 
            AND fs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update flashcards in own sets" ON public.flashcards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets fs 
            WHERE fs.id = flashcards.set_id 
            AND fs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete flashcards in own sets" ON public.flashcards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets fs 
            WHERE fs.id = flashcards.set_id 
            AND fs.user_id = auth.uid()
        )
    );

-- Review Sessions Policies
CREATE POLICY "Users can view own review sessions" ON public.review_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own review sessions" ON public.review_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review sessions" ON public.review_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Review Logs Policies
CREATE POLICY "Users can view own review logs" ON public.review_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.review_sessions rs 
            WHERE rs.id = review_logs.session_id 
            AND rs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own review logs" ON public.review_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.review_sessions rs 
            WHERE rs.id = review_logs.session_id 
            AND rs.user_id = auth.uid()
        )
    );

-- FSRS Parameters Policies
CREATE POLICY "Users can view own FSRS parameters" ON public.fsrs_parameters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own FSRS parameters" ON public.fsrs_parameters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FSRS parameters" ON public.fsrs_parameters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own FSRS parameters" ON public.fsrs_parameters
    FOR DELETE USING (auth.uid() = user_id);

-- ===============================================
-- Triggers and Functions
-- ===============================================

-- Update card count when flashcards are added/removed
CREATE OR REPLACE FUNCTION update_flashcard_set_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.flashcard_sets 
        SET card_count = card_count + 1,
            updated_at = NOW()
        WHERE id = NEW.set_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.flashcard_sets 
        SET card_count = GREATEST(card_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.set_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flashcard_set_card_count_trigger
    AFTER INSERT OR DELETE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION update_flashcard_set_card_count();

-- Update timestamps
CREATE TRIGGER update_flashcard_sets_updated_at 
    BEFORE UPDATE ON public.flashcard_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at 
    BEFORE UPDATE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fsrs_parameters_updated_at 
    BEFORE UPDATE ON public.fsrs_parameters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default FSRS parameters for new users
CREATE OR REPLACE FUNCTION create_default_fsrs_parameters()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.fsrs_parameters (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id, set_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_fsrs_parameters_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_default_fsrs_parameters(); 