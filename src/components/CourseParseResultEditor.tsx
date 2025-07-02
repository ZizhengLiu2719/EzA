import { CourseParseResult, Task } from '@/types';
import { Edit3, Info, List, PlusCircle, Save, Trash2, XCircle } from 'lucide-react';
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

function formatDateInputValue(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

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
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'course_id' | 'created_at' | 'updated_at'>>(emptyTask);

  const handleFieldChange = (field: keyof CourseParseResult, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskChange = (idx: number, field: keyof typeof emptyTask, value: any) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
    }));
  };

  const handleDeleteTask = (idx: number) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter((_, i) => i !== idx) }));
  };

  const handleAddTask = () => {
    if (!newTask.title) return;
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    setNewTask(emptyTask);
  };

  const handleSave = () => {
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
    <div className={styles.editorContainer}>
      <div className={styles.infoBanner}>
        <Info size={20} />
        <p>AI-parsed task lists only include tasks related to course grading. If syllabus information is not clear enough, AI may not extract relevant information. Students should add tasks based on actual course requirements during the semester.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}><Edit3 size={24} /> Course Structured Information Editor</h2>

        <div className={styles.grid}>
          <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
            <label>Course Name</label>
            <input value={data.course_name ?? ''} onChange={e => handleFieldChange('course_name', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Semester</label>
            <input value={data.semester ?? ''} onChange={e => handleFieldChange('semester', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Year</label>
            <input type="number" value={data.year ?? ''} onChange={e => handleFieldChange('year', Number(e.target.value))} />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: 'span 4' }}>
            <label>Course Description</label>
            <textarea value={data.course_description ?? ''} onChange={e => handleFieldChange('course_description', e.target.value)} rows={3}/>
          </div>
          <div className={styles.formGroup} style={{ gridColumn: 'span 4' }}>
            <label>Grading Policy</label>
            <textarea value={data.grading_policy ?? ''} onChange={e => handleFieldChange('grading_policy', e.target.value)} rows={2} />
          </div>
        </div>

        <h3 className={styles.cardSubtitle}><List size={22} /> Task List</h3>
        <div className={styles.taskTable}>
          <div className={`${styles.taskRow} ${styles.taskHeader}`}>
            <div style={{gridColumn: 'span 3'}}>Task Title</div>
            <div>Type</div>
            <div>Due Date</div>
            <div>Priority</div>
            <div>Hours</div>
            <div style={{gridColumn: 'span 3'}}>Description</div>
            <div>Actions</div>
          </div>
          {data.tasks.map((task, idx) => (
            <div key={idx} className={styles.taskRow}>
              <input style={{gridColumn: 'span 3'}} value={task.title ?? ''} onChange={e => handleTaskChange(idx, 'title', e.target.value)} placeholder="Task title" />
              <select value={task.type ?? ''} onChange={e => handleTaskChange(idx, 'type', e.target.value as any)}>
                <option value="assignment">Assignment</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
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
              <input type="number" value={task.estimated_hours ?? ''} min={0.5} step={0.5} onChange={e => handleTaskChange(idx, 'estimated_hours', Number(e.target.value))} />
              <input style={{gridColumn: 'span 3'}} value={task.description ?? ''} onChange={e => handleTaskChange(idx, 'description', e.target.value)} placeholder="Description" />
              <button type="button" onClick={() => handleDeleteTask(idx)} className={styles.deleteButton}><Trash2 size={16}/></button>
            </div>
          ))}
          <div className={`${styles.taskRow} ${styles.addTaskRow}`}>
            <input style={{gridColumn: 'span 3'}} value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="New task title" />
            <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value as any })}>
               <option value="assignment">Assignment</option>
               <option value="reading">Reading</option>
               <option value="writing">Writing</option>
               <option value="exam">Exam</option>
               <option value="quiz">Quiz</option>
               <option value="project">Project</option>
               <option value="presentation">Presentation</option>
            </select>
            <input type="date" value={formatDateInputValue(newTask.due_date)} onChange={e => setNewTask({ ...newTask, due_date: e.target.value || '' })} />
            <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input type="number" value={newTask.estimated_hours} min={0.5} step={0.5} onChange={e => setNewTask({ ...newTask, estimated_hours: Number(e.target.value)})} />
            <input style={{gridColumn: 'span 3'}} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Description" />
            <button type="button" onClick={handleAddTask} className={styles.addButton}><PlusCircle size={16}/><span>Add</span></button>
          </div>
        </div>
        
        <div className={styles.actions}>
          {onCancel && <button className={`${styles.mainButton} ${styles.cancelButton}`} onClick={onCancel}><XCircle size={20}/>Cancel</button>}
          <button className={`${styles.mainButton} ${styles.saveButton}`} onClick={handleSave}><Save size={20}/>Save & Complete</button>
        </div>
      </div>
    </div>
  );
};

export default CourseParseResultEditor;