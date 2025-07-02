-- Add the user_id column to the tasks table, allowing NULL for existing rows
ALTER TABLE public.tasks 
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id); 