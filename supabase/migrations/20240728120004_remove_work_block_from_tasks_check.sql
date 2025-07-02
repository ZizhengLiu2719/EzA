-- First, delete any existing rows that would violate the new constraint.
DELETE FROM public.tasks WHERE type = 'work_block';

-- Then, drop the existing constraint that includes 'work_block'
-- The "IF EXISTS" clause prevents an error if the constraint has already been removed or renamed.
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_type_check;

-- Finally, add the new, stricter constraint that does NOT include 'work_block'
ALTER TABLE public.tasks ADD CONSTRAINT tasks_type_check CHECK (type IN ('reading', 'writing', 'assignment', 'exam', 'quiz', 'project', 'presentation')); 