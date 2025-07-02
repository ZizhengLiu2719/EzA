-- First, drop the existing constraint
ALTER TABLE public.tasks DROP CONSTRAINT tasks_type_check;

-- Then, add a new constraint that includes 'work_block'
ALTER TABLE public.tasks ADD CONSTRAINT tasks_type_check CHECK (type IN ('reading', 'writing', 'assignment', 'exam', 'quiz', 'project', 'presentation', 'work_block')); 