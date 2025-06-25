-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    semester TEXT NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    grading_policy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('syllabus', 'textbook', 'lecture_notes', 'assignment', 'other')),
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('reading', 'writing', 'assignment', 'exam', 'quiz', 'project', 'presentation')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
    estimated_hours DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    actual_hours DECIMAL(5,2),
    weight DECIMAL(5,2), -- percentage of total course grade
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    order_index INTEGER NOT NULL,
    estimated_hours DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    assistant_type TEXT NOT NULL CHECK (assistant_type IN ('writing', 'stem', 'reading', 'programming')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review cards table
CREATE TABLE IF NOT EXISTS public.review_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    last_reviewed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly reports table
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    total_tasks INTEGER NOT NULL DEFAULT 0,
    completion_rate INTEGER NOT NULL DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    study_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    procrastination_index INTEGER NOT NULL DEFAULT 0 CHECK (procrastination_index >= 0 AND procrastination_index <= 10),
    focus_score INTEGER NOT NULL DEFAULT 0 CHECK (focus_score >= 0 AND focus_score <= 100),
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON public.tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_review_cards_course_id ON public.review_cards(course_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON public.weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON public.weekly_reports(week_start);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Users can view own courses" ON public.courses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON public.courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON public.courses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON public.courses
    FOR DELETE USING (auth.uid() = user_id);

-- Course materials policies
CREATE POLICY "Users can view own course materials" ON public.course_materials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_materials.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own course materials" ON public.course_materials
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_materials.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own course materials" ON public.course_materials
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_materials.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own course materials" ON public.course_materials
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = course_materials.course_id 
            AND courses.user_id = auth.uid()
        )
    );

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = tasks.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = tasks.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = tasks.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = tasks.course_id 
            AND courses.user_id = auth.uid()
        )
    );

-- Subtasks policies
CREATE POLICY "Users can view own subtasks" ON public.subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks 
            JOIN public.courses ON courses.id = tasks.course_id
            WHERE tasks.id = subtasks.task_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own subtasks" ON public.subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks 
            JOIN public.courses ON courses.id = tasks.course_id
            WHERE tasks.id = subtasks.task_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own subtasks" ON public.subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.tasks 
            JOIN public.courses ON courses.id = tasks.course_id
            WHERE tasks.id = subtasks.task_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own subtasks" ON public.subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks 
            JOIN public.courses ON courses.id = tasks.course_id
            WHERE tasks.id = subtasks.task_id 
            AND courses.user_id = auth.uid()
        )
    );

-- AI conversations policies
CREATE POLICY "Users can view own conversations" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- AI messages policies
CREATE POLICY "Users can view own messages" ON public.ai_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations 
            WHERE ai_conversations.id = ai_messages.conversation_id 
            AND ai_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own messages" ON public.ai_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations 
            WHERE ai_conversations.id = ai_messages.conversation_id 
            AND ai_conversations.user_id = auth.uid()
        )
    );

-- Review cards policies
CREATE POLICY "Users can view own review cards" ON public.review_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = review_cards.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own review cards" ON public.review_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = review_cards.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own review cards" ON public.review_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = review_cards.course_id 
            AND courses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own review cards" ON public.review_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = review_cards.course_id 
            AND courses.user_id = auth.uid()
        )
    );

-- Weekly reports policies
CREATE POLICY "Users can view own reports" ON public.weekly_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.weekly_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.weekly_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.weekly_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 