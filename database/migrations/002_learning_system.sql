-- ============================================================================
-- Learning System Schema Migration
-- Adds support for flashcard sets, FSRS-5 algorithm, and study analytics
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Flashcard Sets Table
-- 管理用户的闪卡集合
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
    is_public BOOLEAN DEFAULT false,
    card_count INTEGER DEFAULT 0,
    mastery_level REAL DEFAULT 0.0 CHECK (mastery_level >= 0 AND mastery_level <= 1),
    tags TEXT[] DEFAULT '{}',
    visibility TEXT NOT NULL CHECK (visibility IN ('private', 'public', 'shared')) DEFAULT 'private',
    language TEXT DEFAULT 'en',
    category TEXT,
    total_study_time INTEGER DEFAULT 0, -- total seconds spent studying this set
    last_studied TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards Table  
-- 包含FSRS-5算法所需的所有参数
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT,
    explanation TEXT,
    
    -- FSRS-5 Core Parameters
    due TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stability REAL DEFAULT 2.0,                    -- Memory stability (days)
    difficulty REAL DEFAULT 2.5,                   -- Card difficulty (0-10)
    elapsed_days INTEGER DEFAULT 0,                -- Days since last review
    scheduled_days INTEGER DEFAULT 0,              -- Scheduled interval
    reps INTEGER DEFAULT 0,                        -- Total repetitions
    lapses INTEGER DEFAULT 0,                      -- Times forgotten
    state INTEGER DEFAULT 0 CHECK (state BETWEEN 0 AND 3), -- 0=NEW, 1=LEARNING, 2=REVIEW, 3=RELEARNING
    last_review TIMESTAMP WITH TIME ZONE,
    
    -- Learning Statistics
    total_time INTEGER DEFAULT 0,                  -- Total time spent (seconds)
    average_time REAL DEFAULT 0,                   -- Average response time (seconds)
    success_rate REAL DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 1),
    
    -- Metadata
    card_type TEXT DEFAULT 'basic' CHECK (card_type IN ('basic', 'cloze', 'multiple_choice')),
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Sessions Table
-- 记录每次学习会话的详细信息
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('flashcard', 'learn', 'test', 'match', 'gravity', 'ai-tutor')),
    
    -- Session Metrics
    duration INTEGER, -- seconds
    cards_studied INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 1),
    
    -- Detailed Session Data
    session_data JSONB, -- Store detailed session information
    config JSONB,       -- Store session configuration
    
    -- Performance Metrics
    average_response_time REAL DEFAULT 0,
    fastest_response REAL,
    slowest_response REAL,
    streak_best INTEGER DEFAULT 0,
    improvement_rate REAL DEFAULT 0,
    
    -- Session Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review Logs Table  
-- 详细记录每次复习的信息，用于FSRS算法
CREATE TABLE IF NOT EXISTS public.review_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
    
    -- Review Details
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4), -- 1=AGAIN, 2=HARD, 3=GOOD, 4=EASY
    response_time INTEGER, -- milliseconds
    previous_state INTEGER,
    new_state INTEGER,
    
    -- FSRS Parameters at Review Time
    previous_due TIMESTAMP WITH TIME ZONE,
    new_due TIMESTAMP WITH TIME ZONE,
    previous_stability REAL,
    new_stability REAL,
    previous_difficulty REAL,
    new_difficulty REAL,
    elapsed_days INTEGER,
    scheduled_days INTEGER,
    
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review Analytics Table
-- 聚合分析数据，用于学习洞察和进度追踪
CREATE TABLE IF NOT EXISTS public.review_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
    
    -- Time-based Metrics  
    total_time_studied INTEGER DEFAULT 0, -- total seconds
    study_streak_days INTEGER DEFAULT 0,
    last_study_date DATE,
    
    -- Retention Metrics
    retention_rate_1d REAL DEFAULT 0,     -- 24 hour retention
    retention_rate_7d REAL DEFAULT 0,     -- 7 day retention  
    retention_rate_30d REAL DEFAULT 0,    -- 30 day retention
    
    -- Performance Metrics
    mastery_progression JSONB,            -- Daily/weekly mastery changes
    weak_spots JSONB,                     -- Cards that need more work
    strong_areas JSONB,                   -- Well-mastered concepts
    learning_velocity REAL DEFAULT 0,     -- Cards mastered per hour
    
    -- Difficulty Analysis
    difficulty_distribution JSONB,        -- Distribution of card difficulties
    performance_by_difficulty JSONB,      -- Performance metrics by difficulty level
    
    -- Study Pattern Analysis
    best_study_times JSONB,              -- When user performs best
    session_length_optimal INTEGER,       -- Optimal session length in minutes
    break_frequency_optimal INTEGER,      -- Optimal break frequency
    
    -- Predictions and Recommendations
    predicted_completion_date DATE,       -- When set will be mastered
    recommended_daily_cards INTEGER,      -- Suggested daily review count
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FSRS Parameters Table
-- 存储用户个性化的FSRS算法参数
CREATE TABLE IF NOT EXISTS public.fsrs_parameters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
    
    -- FSRS-5 17 Parameters
    w0 REAL DEFAULT 0.4072,    -- Initial difficulty weight
    w1 REAL DEFAULT 1.1829,    -- Difficulty growth weight  
    w2 REAL DEFAULT 3.1262,    -- Stability base weight
    w3 REAL DEFAULT 15.4722,   -- Stability growth weight
    w4 REAL DEFAULT 7.2102,    -- Forgetting weight
    w5 REAL DEFAULT 0.5316,    -- Memory weight
    w6 REAL DEFAULT 1.0651,    -- Relearning weight
    w7 REAL DEFAULT 0.0234,    -- Error recall weight
    w8 REAL DEFAULT 1.616,     -- Correct recall weight
    w9 REAL DEFAULT 0.1544,    -- Retrieval success weight
    w10 REAL DEFAULT 0.8395,   -- Retrieval failure weight
    w11 REAL DEFAULT 1.9519,   -- Memory strength weight
    w12 REAL DEFAULT 0.0967,   -- Memory decay weight
    w13 REAL DEFAULT 0.8132,   -- Context weight
    w14 REAL DEFAULT 0.0179,   -- Interval effect weight
    w15 REAL DEFAULT 0.1097,   -- Difficulty correction weight
    w16 REAL DEFAULT 2.4681,   -- Stability correction weight
    
    -- Algorithm Configuration
    request_retention REAL DEFAULT 0.9,   -- Target retention rate (90%)
    maximum_interval INTEGER DEFAULT 36500, -- Max interval in days (100 years)
    easy_bonus REAL DEFAULT 1.3,          -- Easy answer bonus multiplier
    hard_interval REAL DEFAULT 1.2,       -- Hard answer interval factor
    new_interval REAL DEFAULT 0.0,        -- New card initial interval
    graduating_interval INTEGER DEFAULT 1, -- Graduating interval (days)
    easy_interval INTEGER DEFAULT 4,      -- Easy interval (days)
    
    -- Learning Steps (in minutes)
    learning_steps INTEGER[] DEFAULT '{1, 10}',     -- [1min, 10min]
    relearning_steps INTEGER[] DEFAULT '{10}',      -- [10min]
    
    -- Auto-optimization Settings
    auto_optimize BOOLEAN DEFAULT true,
    last_optimization TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    optimization_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one parameter set per user per set (or global if set_id is null)
    UNIQUE(user_id, set_id)
);

-- ============================================================================
-- INDEXES for Performance Optimization
-- ============================================================================

-- Flashcard Sets indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON public.flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_is_public ON public.flashcard_sets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_subject ON public.flashcard_sets(subject);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_last_studied ON public.flashcard_sets(last_studied);

-- Flashcards indexes  
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON public.flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due ON public.flashcards(due);
CREATE INDEX IF NOT EXISTS idx_flashcards_state ON public.flashcards(state);
CREATE INDEX IF NOT EXISTS idx_flashcards_last_review ON public.flashcards(last_review);
CREATE INDEX IF NOT EXISTS idx_flashcards_due_state ON public.flashcards(due, state); -- Composite for due cards

-- Study Sessions indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_set_id ON public.study_sessions(set_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON public.study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_mode ON public.study_sessions(mode);

-- Review Logs indexes
CREATE INDEX IF NOT EXISTS idx_review_logs_card_id ON public.review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_user_id ON public.review_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_session_id ON public.review_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON public.review_logs(reviewed_at);

-- Review Analytics indexes
CREATE INDEX IF NOT EXISTS idx_review_analytics_user_id ON public.review_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_set_id ON public.review_analytics(set_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_updated_at ON public.review_analytics(updated_at);

-- FSRS Parameters indexes
CREATE INDEX IF NOT EXISTS idx_fsrs_parameters_user_id ON public.fsrs_parameters(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_parameters ENABLE ROW LEVEL SECURITY;

-- Flashcard Sets Policies
CREATE POLICY "Users can view own flashcard sets" ON public.flashcard_sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public flashcard sets" ON public.flashcard_sets
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own flashcard sets" ON public.flashcard_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard sets" ON public.flashcard_sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard sets" ON public.flashcard_sets
    FOR DELETE USING (auth.uid() = user_id);

-- Flashcards Policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets 
            WHERE flashcard_sets.id = flashcards.set_id 
            AND (flashcard_sets.user_id = auth.uid() OR flashcard_sets.is_public = true)
        )
    );

CREATE POLICY "Users can insert own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets 
            WHERE flashcard_sets.id = flashcards.set_id 
            AND flashcard_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own flashcards" ON public.flashcards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets 
            WHERE flashcard_sets.id = flashcards.set_id 
            AND flashcard_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own flashcards" ON public.flashcards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.flashcard_sets 
            WHERE flashcard_sets.id = flashcards.set_id 
            AND flashcard_sets.user_id = auth.uid()
        )
    );

-- Study Sessions Policies
CREATE POLICY "Users can view own study sessions" ON public.study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON public.study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON public.study_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions" ON public.study_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Review Logs Policies
CREATE POLICY "Users can view own review logs" ON public.review_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review logs" ON public.review_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Review Analytics Policies
CREATE POLICY "Users can view own review analytics" ON public.review_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review analytics" ON public.review_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review analytics" ON public.review_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- FSRS Parameters Policies
CREATE POLICY "Users can view own fsrs parameters" ON public.fsrs_parameters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fsrs parameters" ON public.fsrs_parameters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fsrs parameters" ON public.fsrs_parameters
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update card count in flashcard_sets
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
        SET card_count = card_count - 1,
            updated_at = NOW()
        WHERE id = OLD.set_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for card count updates
CREATE TRIGGER trigger_update_flashcard_set_card_count
    AFTER INSERT OR DELETE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION update_flashcard_set_card_count();

-- Function to update mastery level based on card performance
CREATE OR REPLACE FUNCTION update_set_mastery_level()
RETURNS TRIGGER AS $$
DECLARE
    avg_success_rate REAL;
    total_cards INTEGER;
BEGIN
    -- Calculate average success rate for the set
    SELECT 
        AVG(success_rate),
        COUNT(*)
    INTO avg_success_rate, total_cards
    FROM public.flashcards 
    WHERE set_id = NEW.set_id AND reps > 0;
    
    -- Update set mastery level
    UPDATE public.flashcard_sets 
    SET mastery_level = COALESCE(avg_success_rate, 0),
        updated_at = NOW()
    WHERE id = NEW.set_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for mastery level updates
CREATE TRIGGER trigger_update_set_mastery_level
    AFTER UPDATE ON public.flashcards
    FOR EACH ROW 
    WHEN (OLD.success_rate IS DISTINCT FROM NEW.success_rate)
    EXECUTE FUNCTION update_set_mastery_level();

-- Function to initialize FSRS parameters for new users
CREATE OR REPLACE FUNCTION initialize_user_fsrs_parameters()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.fsrs_parameters (user_id, set_id)
    VALUES (NEW.id, NULL)
    ON CONFLICT (user_id, set_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize FSRS parameters for new users
CREATE TRIGGER trigger_initialize_user_fsrs_parameters
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION initialize_user_fsrs_parameters();

-- Update triggers for updated_at fields
CREATE TRIGGER update_flashcard_sets_updated_at 
    BEFORE UPDATE ON public.flashcard_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at 
    BEFORE UPDATE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_analytics_updated_at 
    BEFORE UPDATE ON public.review_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fsrs_parameters_updated_at 
    BEFORE UPDATE ON public.fsrs_parameters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for due cards with set information
CREATE OR REPLACE VIEW public.due_cards_with_sets AS
SELECT 
    f.*,
    fs.title as set_title,
    fs.user_id
FROM public.flashcards f
JOIN public.flashcard_sets fs ON f.set_id = fs.id
WHERE f.due <= NOW() AND f.state IN (1, 2, 3); -- LEARNING, REVIEW, RELEARNING

-- View for user study statistics
CREATE OR REPLACE VIEW public.user_study_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT fs.id) as total_sets,
    COUNT(DISTINCT f.id) as total_cards,
    COUNT(DISTINCT CASE WHEN ss.started_at >= CURRENT_DATE THEN ss.id END) as sessions_today,
    COALESCE(SUM(CASE WHEN ss.started_at >= CURRENT_DATE THEN ss.duration END), 0) as time_studied_today,
    COUNT(DISTINCT CASE WHEN f.due <= NOW() THEN f.id END) as cards_due_now
FROM public.users u
LEFT JOIN public.flashcard_sets fs ON u.id = fs.user_id
LEFT JOIN public.flashcards f ON fs.id = f.set_id
LEFT JOIN public.study_sessions ss ON u.id = ss.user_id
GROUP BY u.id;

-- ============================================================================
-- INITIAL DATA SEEDING (Optional)
-- ============================================================================

-- Function to create a sample flashcard set for new users (optional)
CREATE OR REPLACE FUNCTION create_sample_flashcard_set(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    set_id UUID;
BEGIN
    -- Create a sample set
    INSERT INTO public.flashcard_sets (
        user_id, 
        title, 
        description, 
        subject,
        difficulty,
        tags
    ) VALUES (
        p_user_id,
        'Welcome to EzA Learning!',
        'A sample flashcard set to get you started with spaced repetition learning.',
        'Tutorial',
        1,
        ARRAY['tutorial', 'welcome', 'sample']
    ) RETURNING id INTO set_id;
    
    -- Add sample cards
    INSERT INTO public.flashcards (set_id, question, answer, hint, explanation) VALUES
    (set_id, 'What does SRS stand for?', 'Spaced Repetition System', 'Think about the learning method', 'Spaced Repetition Systems help optimize memory retention by timing reviews.'),
    (set_id, 'What is the FSRS algorithm?', 'Free Spaced Repetition Scheduler', 'It''s a modern algorithm', 'FSRS is an advanced algorithm that predicts memory and optimizes review scheduling.'),
    (set_id, 'How often should you review flashcards?', 'Based on your memory strength', 'The algorithm decides', 'The FSRS algorithm calculates optimal review intervals based on your performance.');
    
    RETURN set_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.flashcard_sets IS 'Storage for user flashcard collections with metadata';
COMMENT ON TABLE public.flashcards IS 'Individual flashcards with FSRS-5 algorithm parameters';
COMMENT ON TABLE public.study_sessions IS 'Record of learning sessions with detailed metrics';
COMMENT ON TABLE public.review_logs IS 'Detailed log of each card review for FSRS algorithm';
COMMENT ON TABLE public.review_analytics IS 'Aggregated analytics and insights for learning progress';
COMMENT ON TABLE public.fsrs_parameters IS 'User-specific FSRS algorithm parameters for personalization'; 