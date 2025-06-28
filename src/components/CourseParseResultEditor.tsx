import { CourseParseResult, Task } from '@/types';
import React, { useState } from 'react';
import styles from './CourseParseResultEditor.module.css';

interface Props {
  initialData: CourseParseResult;
  onSave: (data: CourseParseResult) => void;
  onCancel?: () => void;
}

const emptyTask: Omit<Task, 'id' | 'course_id' | 'created_at' | 'updated_at'> = {
  title: '',
  type: 'assignment',
  due_date: '',
  priority: 'medium',
  estimated_hours: 2,
  status: 'pending',
  description: '',
};

// 工具函数：格式化日期为yyyy-MM-dd
function formatDateInputValue(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// 格式化所有任务的 due_date 字段
function normalizeTasksDate(tasks: any[]) {
  return tasks.map(task => ({
    ...task,
    due_date: formatDateInputValue(task.due_date)
  }));
}

const CourseParseResultEditor: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState<CourseParseResult>({
    ...initialData,
    tasks: normalizeTasksDate(initialData.tasks || [])
  });
  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'course_id' | 'created_at' | 'updated_at'>>(emptyTask);

  // 课程信息编辑
  const handleFieldChange = (field: keyof CourseParseResult, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // 任务编辑
  const handleTaskChange = (idx: number, field: keyof typeof emptyTask, value: any) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map((t, i) => i === idx ? { ...t, [field]: value } : t),
    }));
  };

  const handleDeleteTask = (idx: number) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter((_, i) => i !== idx) }));
  };

  const handleAddTask = () => {
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    setNewTask(emptyTask);
  };

  // 保存时排序
  const handleSave = () => {
    // 排序：有截止日期的任务按日期升序排列，无截止日期的任务排最后
    const sortedTasks = data.tasks.slice().sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (a.due_date) {
        return -1;
      } else if (b.due_date) {
        return 1;
      } else {
        return 0;
      }
    });
    onSave({ ...data, tasks: sortedTasks });
  };

  return (
    <div className={styles.editorRoot}>
      <h2>Course Structured Information Editor</h2>
      <div className={styles.section}>
        <label>Course Name:</label>
        <input value={data.course_name ?? ''} onChange={e => handleFieldChange('course_name', e.target.value)} />
      </div>
      <div className={styles.section}>
        <label>Semester:</label>
        <input value={data.semester ?? ''} onChange={e => handleFieldChange('semester', e.target.value)} style={{ width: 100 }} />
        <label>Year:</label>
        <input type="number" value={data.year ?? ''} onChange={e => handleFieldChange('year', Number(e.target.value))} style={{ width: 80 }} />
      </div>
      <div className={styles.section}>
        <label>Course Description:</label>
        <textarea value={data.course_description ?? ''} onChange={e => handleFieldChange('course_description', e.target.value)} />
      </div>
      <div className={styles.section}>
        <label>Grading Policy:</label>
        <input value={data.grading_policy ?? ''} onChange={e => handleFieldChange('grading_policy', e.target.value)} />
      </div>
      <div className={styles.section}>
        <h3>Task List</h3>
        {data.tasks.length === 0 && <div>No tasks</div>}
        {data.tasks.length > 0 && (
          <div className={styles.taskHeader}>
            <span>Task Title</span>
            <span>Type</span>
            <span>Due Date</span>
            <span>Priority</span>
            <span>Estimated Hours</span>
            <span>Task Description</span>
            <span>Actions</span>
          </div>
        )}
        {data.tasks.map((task, idx) => (
          <div key={idx} className={styles.taskItem}>
            <input value={task.title ?? ''} onChange={e => handleTaskChange(idx, 'title', e.target.value)} placeholder="Task title" />
            <select value={task.type ?? ''} onChange={e => handleTaskChange(idx, 'type', e.target.value as any)}>
              <option value="reading">Reading</option>
              <option value="writing">Writing</option>
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
              <option value="presentation">Presentation</option>
            </select>
            <input type="date" value={formatDateInputValue(task.due_date)} onChange={e => handleTaskChange(idx, 'due_date', e.target.value || '')} />
            <select value={task.priority ?? ''} onChange={e => handleTaskChange(idx, 'priority', e.target.value as any)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input type="number" value={task.estimated_hours ?? ''} min={0.5} step={0.5} onChange={e => handleTaskChange(idx, 'estimated_hours', Number(e.target.value))} style={{ width: '100%' }} />
            <input value={task.description ?? ''} onChange={e => handleTaskChange(idx, 'description', e.target.value)} placeholder="Description" />
            <button type="button" onClick={() => handleDeleteTask(idx)}>Delete</button>
          </div>
        ))}
        <div className={styles.addTaskRow}>
          <input value={newTask.title ?? ''} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="New task title" />
          <select value={newTask.type ?? ''} onChange={e => setNewTask({ ...newTask, type: e.target.value as any })}>
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="quiz">Quiz</option>
            <option value="project">Project</option>
            <option value="presentation">Presentation</option>
          </select>
          <input type="date" value={formatDateInputValue(newTask.due_date)} onChange={e => setNewTask({ ...newTask, due_date: e.target.value || '' })} />
          <button type="button" onClick={handleAddTask}>Add Task</button>
        </div>
      </div>
      <div className={styles.section} style={{ marginTop: 24 }}>
        <button className={styles.saveBtn} onClick={handleSave}>Save/Complete</button>
        {onCancel && <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  );
};

export default CourseParseResultEditor; 