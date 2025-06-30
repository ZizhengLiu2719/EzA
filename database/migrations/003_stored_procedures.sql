-- ============================================================================
-- Stored Procedures for Learning System
-- Complex database operations for FSRS algorithm and study analytics
-- ============================================================================

-- Function to submit a card review with transaction safety
CREATE OR REPLACE FUNCTION submit_card_review_transaction(
    p_card_id UUID,
    p_user_id UUID,
    p_session_id UUID DEFAULT NULL,
    p_rating INTEGER,
    p_response_time INTEGER DEFAULT NULL,
    p_due TIMESTAMP WITH TIME ZONE,
    p_stability REAL,
    p_difficulty REAL,
    p_elapsed_days INTEGER,
    p_scheduled_days INTEGER,
    p_reps INTEGER,
    p_lapses INTEGER,
    p_state INTEGER,
    p_last_review TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
DECLARE
    v_previous_state INTEGER;
    v_previous_due TIMESTAMP WITH TIME ZONE;
    v_previous_stability REAL;
    v_previous_difficulty REAL;
BEGIN
    -- Get current card state for review log
    SELECT state, due, stability, difficulty
    INTO v_previous_state, v_previous_due, v_previous_stability, v_previous_difficulty
    FROM public.flashcards
    WHERE id = p_card_id;

    -- Update the flashcard with new FSRS data
    UPDATE public.flashcards
    SET 
        due = p_due,
        stability = p_stability,
        difficulty = p_difficulty,
        elapsed_days = p_elapsed_days,
        scheduled_days = p_scheduled_days,
        reps = p_reps,
        lapses = p_lapses,
        state = p_state,
        last_review = p_last_review,
        updated_at = NOW()
    WHERE id = p_card_id;

    -- Insert review log
    INSERT INTO public.review_logs (
        user_id,
        card_id,
        session_id,
        rating,
        response_time,
        previous_state,
        new_state,
        previous_due,
        new_due,
        previous_stability,
        new_stability,
        previous_difficulty,
        new_difficulty,
        elapsed_days,
        scheduled_days,
        reviewed_at
    ) VALUES (
        p_user_id,
        p_card_id,
        p_session_id,
        p_rating,
        p_response_time,
        v_previous_state,
        p_state,
        v_previous_due,
        p_due,
        v_previous_stability,
        p_stability,
        v_previous_difficulty,
        p_difficulty,
        p_elapsed_days,
        p_scheduled_days,
        NOW()
    );

    -- Update card statistics
    UPDATE public.flashcards
    SET 
        total_time = total_time + COALESCE(p_response_time / 1000, 0),
        success_rate = CASE 
            WHEN p_reps > 0 THEN GREATEST(0, (p_reps - p_lapses)::REAL / p_reps)
            ELSE 0
        END,
        average_time = CASE 
            WHEN p_reps > 0 THEN (total_time + COALESCE(p_response_time / 1000, 0)) / p_reps
            ELSE COALESCE(p_response_time / 1000, 0)
        END
    WHERE id = p_card_id;

END;
$$ LANGUAGE plpgsql;

-- Function to calculate user study statistics
CREATE OR REPLACE FUNCTION get_user_study_stats(
    p_user_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_sessions INTEGER,
    total_study_time INTEGER,
    total_cards_reviewed INTEGER,
    average_accuracy REAL,
    current_streak INTEGER,
    cards_due_today INTEGER
) AS $$
DECLARE
    v_start_date DATE;
BEGIN
    v_start_date := CURRENT_DATE - INTERVAL '1 day' * p_days_back;

    -- Get basic stats
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(SUM(duration), 0)::INTEGER,
        COALESCE(SUM(cards_studied), 0)::INTEGER,
        CASE 
            WHEN SUM(total_answers) > 0 THEN SUM(correct_answers)::REAL / SUM(total_answers)
            ELSE 0
        END
    INTO total_sessions, total_study_time, total_cards_reviewed, average_accuracy
    FROM public.study_sessions
    WHERE user_id = p_user_id 
    AND started_at >= v_start_date
    AND status = 'completed';

    -- Calculate current streak
    WITH daily_sessions AS (
        SELECT DATE(started_at) as study_date
        FROM public.study_sessions
        WHERE user_id = p_user_id AND status = 'completed'
        GROUP BY DATE(started_at)
        ORDER BY DATE(started_at) DESC
    ),
    streak_calc AS (
        SELECT 
            study_date,
            ROW_NUMBER() OVER (ORDER BY study_date DESC) as rn,
            (CURRENT_DATE - study_date) as days_ago
        FROM daily_sessions
    )
    SELECT COALESCE(MAX(rn), 0)
    INTO current_streak
    FROM streak_calc
    WHERE days_ago = rn - 1;

    -- Count cards due today
    SELECT COUNT(*)::INTEGER
    INTO cards_due_today
    FROM public.flashcards f
    JOIN public.flashcard_sets fs ON f.set_id = fs.id
    WHERE fs.user_id = p_user_id
    AND f.due <= NOW()
    AND f.state IN (1, 2, 3); -- Learning, Review, Relearning

    RETURN QUERY SELECT 
        get_user_study_stats.total_sessions,
        get_user_study_stats.total_study_time,
        get_user_study_stats.total_cards_reviewed,
        get_user_study_stats.average_accuracy,
        get_user_study_stats.current_streak,
        get_user_study_stats.cards_due_today;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize FSRS parameters for a user
CREATE OR REPLACE FUNCTION optimize_fsrs_parameters(
    p_user_id UUID,
    p_set_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_review_count INTEGER;
    v_retention_rate REAL;
BEGIN
    -- Count reviews for parameter optimization
    SELECT COUNT(*)
    INTO v_review_count
    FROM public.review_logs rl
    JOIN public.flashcards f ON rl.card_id = f.id
    JOIN public.flashcard_sets fs ON f.set_id = fs.id
    WHERE fs.user_id = p_user_id
    AND (p_set_id IS NULL OR fs.id = p_set_id);

    -- Only optimize if we have enough data (minimum 100 reviews)
    IF v_review_count < 100 THEN
        RETURN;
    END IF;

    -- Calculate current retention rate
    WITH recent_reviews AS (
        SELECT 
            rl.rating,
            rl.reviewed_at
        FROM public.review_logs rl
        JOIN public.flashcards f ON rl.card_id = f.id
        JOIN public.flashcard_sets fs ON f.set_id = fs.id
        WHERE fs.user_id = p_user_id
        AND (p_set_id IS NULL OR fs.id = p_set_id)
        AND rl.reviewed_at >= NOW() - INTERVAL '30 days'
    )
    SELECT 
        COUNT(CASE WHEN rating >= 3 THEN 1 END)::REAL / COUNT(*)
    INTO v_retention_rate
    FROM recent_reviews;

    -- Update request retention based on performance
    -- If performing well (>90% retention), increase target
    -- If struggling (<80% retention), decrease target
    UPDATE public.fsrs_parameters
    SET 
        request_retention = CASE 
            WHEN v_retention_rate > 0.9 THEN LEAST(0.95, request_retention + 0.02)
            WHEN v_retention_rate < 0.8 THEN GREATEST(0.8, request_retention - 0.02)
            ELSE request_retention
        END,
        last_optimization = NOW(),
        optimization_data = jsonb_build_object(
            'review_count', v_review_count,
            'retention_rate', v_retention_rate,
            'optimization_date', NOW()
        )
    WHERE user_id = p_user_id
    AND (set_id IS NULL OR set_id = p_set_id);

END;
$$ LANGUAGE plpgsql;

-- Function to update review analytics
CREATE OR REPLACE FUNCTION update_review_analytics(
    p_user_id UUID,
    p_set_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_total_time INTEGER;
    v_retention_1d REAL;
    v_retention_7d REAL;
    v_retention_30d REAL;
    v_learning_velocity REAL;
    v_weak_spots JSONB;
    v_strong_areas JSONB;
BEGIN
    -- Calculate total study time
    SELECT COALESCE(SUM(duration), 0)
    INTO v_total_time
    FROM public.study_sessions
    WHERE user_id = p_user_id
    AND (p_set_id IS NULL OR set_id = p_set_id)
    AND status = 'completed';

    -- Calculate retention rates
    WITH retention_calc AS (
        SELECT 
            rl.card_id,
            rl.reviewed_at,
            rl.rating,
            LEAD(rl.reviewed_at) OVER (PARTITION BY rl.card_id ORDER BY rl.reviewed_at) as next_review,
            LEAD(rl.rating) OVER (PARTITION BY rl.card_id ORDER BY rl.reviewed_at) as next_rating
        FROM public.review_logs rl
        JOIN public.flashcards f ON rl.card_id = f.id
        JOIN public.flashcard_sets fs ON f.set_id = fs.id
        WHERE fs.user_id = p_user_id
        AND (p_set_id IS NULL OR fs.id = p_set_id)
    )
    SELECT 
        -- 1 day retention
        COUNT(CASE WHEN next_review - reviewed_at >= INTERVAL '1 day' AND next_rating >= 3 THEN 1 END)::REAL /
        NULLIF(COUNT(CASE WHEN next_review - reviewed_at >= INTERVAL '1 day' THEN 1 END), 0),
        -- 7 day retention
        COUNT(CASE WHEN next_review - reviewed_at >= INTERVAL '7 days' AND next_rating >= 3 THEN 1 END)::REAL /
        NULLIF(COUNT(CASE WHEN next_review - reviewed_at >= INTERVAL '7 days' THEN 1 END), 0),
        -- 30 day retention
        COUNT(CASE WHEN next_review - reviewed_at >= INTERVAL '30 days' AND next_rating >= 3 THEN 1 END)::REAL /
        NULLIF(COUNT(CASE WHEN next_review - reviewed_at >= INTERVAL '30 days' THEN 1 END), 0)
    INTO v_retention_1d, v_retention_7d, v_retention_30d
    FROM retention_calc
    WHERE next_review IS NOT NULL;

    -- Calculate learning velocity (cards mastered per hour)
    WITH mastered_cards AS (
        SELECT COUNT(*) as mastered_count
        FROM public.flashcards f
        JOIN public.flashcard_sets fs ON f.set_id = fs.id
        WHERE fs.user_id = p_user_id
        AND (p_set_id IS NULL OR fs.id = p_set_id)
        AND f.success_rate >= 0.8
        AND f.reps >= 3
    )
    SELECT 
        CASE 
            WHEN v_total_time > 0 THEN mastered_count::REAL / (v_total_time / 3600.0)
            ELSE 0
        END
    INTO v_learning_velocity
    FROM mastered_cards;

    -- Identify weak spots (cards with low success rate)
    SELECT jsonb_agg(
        jsonb_build_object(
            'card_id', f.id,
            'question', LEFT(f.question, 100),
            'success_rate', f.success_rate,
            'review_count', f.reps
        )
    )
    INTO v_weak_spots
    FROM public.flashcards f
    JOIN public.flashcard_sets fs ON f.set_id = fs.id
    WHERE fs.user_id = p_user_id
    AND (p_set_id IS NULL OR fs.id = p_set_id)
    AND f.success_rate < 0.6
    AND f.reps >= 3
    ORDER BY f.success_rate ASC
    LIMIT 10;

    -- Identify strong areas (cards with high success rate)
    SELECT jsonb_agg(
        jsonb_build_object(
            'card_id', f.id,
            'question', LEFT(f.question, 100),
            'success_rate', f.success_rate,
            'review_count', f.reps
        )
    )
    INTO v_strong_areas
    FROM public.flashcards f
    JOIN public.flashcard_sets fs ON f.set_id = fs.id
    WHERE fs.user_id = p_user_id
    AND (p_set_id IS NULL OR fs.id = p_set_id)
    AND f.success_rate >= 0.9
    AND f.reps >= 3
    ORDER BY f.success_rate DESC
    LIMIT 10;

    -- Insert or update analytics
    INSERT INTO public.review_analytics (
        user_id,
        set_id,
        total_time_studied,
        retention_rate_1d,
        retention_rate_7d,
        retention_rate_30d,
        learning_velocity,
        weak_spots,
        strong_areas,
        updated_at
    ) VALUES (
        p_user_id,
        p_set_id,
        v_total_time,
        COALESCE(v_retention_1d, 0),
        COALESCE(v_retention_7d, 0),
        COALESCE(v_retention_30d, 0),
        COALESCE(v_learning_velocity, 0),
        COALESCE(v_weak_spots, '[]'::jsonb),
        COALESCE(v_strong_areas, '[]'::jsonb),
        NOW()
    )
    ON CONFLICT (user_id, set_id) 
    DO UPDATE SET
        total_time_studied = EXCLUDED.total_time_studied,
        retention_rate_1d = EXCLUDED.retention_rate_1d,
        retention_rate_7d = EXCLUDED.retention_rate_7d,
        retention_rate_30d = EXCLUDED.retention_rate_30d,
        learning_velocity = EXCLUDED.learning_velocity,
        weak_spots = EXCLUDED.weak_spots,
        strong_areas = EXCLUDED.strong_areas,
        updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- Function to get study recommendations
CREATE OR REPLACE FUNCTION get_study_recommendations(p_user_id UUID)
RETURNS TABLE (
    recommendation_type TEXT,
    title TEXT,
    description TEXT,
    priority INTEGER,
    data JSONB
) AS $$
BEGIN
    -- Cards due for review
    RETURN QUERY
    WITH due_cards AS (
        SELECT COUNT(*) as due_count
        FROM public.flashcards f
        JOIN public.flashcard_sets fs ON f.set_id = fs.id
        WHERE fs.user_id = p_user_id
        AND f.due <= NOW()
        AND f.state IN (1, 2, 3)
    )
    SELECT 
        'due_cards'::TEXT,
        'Cards Ready for Review'::TEXT,
        ('You have ' || due_count || ' cards ready for review')::TEXT,
        CASE WHEN due_count > 20 THEN 3 ELSE 2 END,
        jsonb_build_object('count', due_count)
    FROM due_cards
    WHERE due_count > 0;

    -- Study streak
    RETURN QUERY
    WITH streak_data AS (
        SELECT get_user_study_stats.current_streak
        FROM get_user_study_stats(p_user_id, 30)
    )
    SELECT 
        'streak'::TEXT,
        CASE 
            WHEN current_streak = 0 THEN 'Start Your Study Streak'
            WHEN current_streak < 7 THEN 'Build Your Weekly Streak'
            ELSE 'Maintain Your Streak'
        END::TEXT,
        CASE 
            WHEN current_streak = 0 THEN 'Study today to start building a learning habit'
            WHEN current_streak < 7 THEN ('Study today to reach a ' || (7 - current_streak) || '-day streak!')
            ELSE ('Amazing! You have a ' || current_streak || '-day streak!')
        END::TEXT,
        CASE 
            WHEN current_streak = 0 THEN 3
            WHEN current_streak < 7 THEN 2
            ELSE 1
        END,
        jsonb_build_object('current_streak', current_streak)
    FROM streak_data;

    -- Low performance cards
    RETURN QUERY
    WITH weak_cards AS (
        SELECT COUNT(*) as weak_count
        FROM public.flashcards f
        JOIN public.flashcard_sets fs ON f.set_id = fs.id
        WHERE fs.user_id = p_user_id
        AND f.success_rate < 0.6
        AND f.reps >= 3
    )
    SELECT 
        'weak_cards'::TEXT,
        'Review Struggling Cards'::TEXT,
        ('You have ' || weak_count || ' cards that need extra attention')::TEXT,
        2::INTEGER,
        jsonb_build_object('count', weak_count)
    FROM weak_cards
    WHERE weak_count > 0;

    -- New cards available
    RETURN QUERY
    WITH new_cards AS (
        SELECT COUNT(*) as new_count
        FROM public.flashcards f
        JOIN public.flashcard_sets fs ON f.set_id = fs.id
        WHERE fs.user_id = p_user_id
        AND f.state = 0
    )
    SELECT 
        'new_cards'::TEXT,
        'Learn New Cards'::TEXT,
        ('You have ' || new_count || ' new cards ready to learn')::TEXT,
        1::INTEGER,
        jsonb_build_object('count', new_count)
    FROM new_cards
    WHERE new_count > 0;

END;
$$ LANGUAGE plpgsql;

-- Function to backup user data
CREATE OR REPLACE FUNCTION backup_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_backup JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_id', p_user_id,
        'backup_date', NOW(),
        'flashcard_sets', (
            SELECT jsonb_agg(to_jsonb(fs))
            FROM public.flashcard_sets fs
            WHERE fs.user_id = p_user_id
        ),
        'flashcards', (
            SELECT jsonb_agg(to_jsonb(f))
            FROM public.flashcards f
            JOIN public.flashcard_sets fs ON f.set_id = fs.id
            WHERE fs.user_id = p_user_id
        ),
        'study_sessions', (
            SELECT jsonb_agg(to_jsonb(ss))
            FROM public.study_sessions ss
            WHERE ss.user_id = p_user_id
            AND ss.created_at >= NOW() - INTERVAL '90 days'
        ),
        'fsrs_parameters', (
            SELECT jsonb_agg(to_jsonb(fp))
            FROM public.fsrs_parameters fp
            WHERE fp.user_id = p_user_id
        )
    )
    INTO v_backup;

    RETURN v_backup;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION submit_card_review_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_study_stats TO authenticated;
GRANT EXECUTE ON FUNCTION optimize_fsrs_parameters TO authenticated;
GRANT EXECUTE ON FUNCTION update_review_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_study_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION backup_user_data TO authenticated;

-- Comments
COMMENT ON FUNCTION submit_card_review_transaction IS 'Atomically updates card review data and creates review log';
COMMENT ON FUNCTION get_user_study_stats IS 'Returns comprehensive study statistics for a user';
COMMENT ON FUNCTION optimize_fsrs_parameters IS 'Optimizes FSRS parameters based on user performance';
COMMENT ON FUNCTION update_review_analytics IS 'Updates aggregated review analytics data';
COMMENT ON FUNCTION get_study_recommendations IS 'Generates personalized study recommendations';
COMMENT ON FUNCTION backup_user_data IS 'Creates a complete backup of user study data'; 