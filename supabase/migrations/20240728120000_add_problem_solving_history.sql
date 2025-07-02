-- Create the table to store problem solving history
CREATE TABLE public.problem_solving_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    problem_type TEXT NOT NULL CHECK (problem_type IN ('text', 'image')),
    problem_input TEXT NOT NULL,
    ai_solution JSONB,
    problem_title TEXT,
    CONSTRAINT user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- Add comments to the table and columns
COMMENT ON TABLE public.problem_solving_history IS 'Stores the history of problems solved by users.';
COMMENT ON COLUMN public.problem_solving_history.user_id IS 'The user who solved the problem.';
COMMENT ON COLUMN public.problem_solving_history.problem_type IS 'The type of input for the problem (text or image).';
COMMENT ON COLUMN public.problem_solving_history.problem_input IS 'The input of the problem, either text or a URL to an image.';
COMMENT ON COLUMN public.problem_solving_history.ai_solution IS 'The step-by-step solution provided by the AI.';
COMMENT ON COLUMN public.problem_solving_history.problem_title IS 'A short title for the problem, for display in history lists.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.problem_solving_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own history
CREATE POLICY "Allow users to view their own history"
ON public.problem_solving_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Allow users to insert their own history"
ON public.problem_solving_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own history (e.g., rename)
CREATE POLICY "Allow users to update their own history"
ON public.problem_solving_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Allow users to delete their own history"
ON public.problem_solving_history
FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_solving_history TO authenticated;
GRANT ALL ON TABLE public.problem_solving_history TO service_role; 