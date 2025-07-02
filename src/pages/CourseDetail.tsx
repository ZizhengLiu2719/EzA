import { courseParseApi, coursesApi } from '@/api/courses';
import { Course, Task } from '@/types';
import { ArrowLeft, BookOpen, Calendar, ListChecks, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './CourseDetail.module.css';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const courseRes = await coursesApi.getUserCourses();
        const found = courseRes.data.find((c: any) => c.id === courseId);
        if (!found) throw new Error('Course not found');
        setCourse(found);
        const tasksRes = await courseParseApi.getCourseTasks(courseId!);
        setTasks(tasksRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Loading failed');
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchData();
  }, [courseId]);

  const getPriorityClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return styles.highPriority;
      case 'medium':
        return styles.mediumPriority;
      case 'low':
        return styles.lowPriority;
      default:
        return '';
    }
  };

  if (loading) return <div className={styles.container}><div className={styles.loader}></div></div>;
  if (error) return <div className={styles.container}><div className={styles.error}>{error}</div></div>;
  if (!course) return null;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/courses')} className={styles.backButton}>
        <ArrowLeft size={18} />
        <span>Back to Courses</span>
      </button>

      <div className={styles.courseCard}>
        <div className={styles.cardHeader}>
          <BookOpen size={28} className={styles.headerIcon} />
          <h1 className={styles.courseName}>{course.name}</h1>
        </div>
        <div className={styles.courseMeta}>
          <span className={styles.metaItem}>
            <Calendar size={16} />
            {course.semester} {course.year}
          </span>
        </div>
        <div className={styles.courseContent}>
          {course.description && (
            <div className={styles.contentBlock}>
              <h3 className={styles.blockTitle}>Description</h3>
              <p>{course.description}</p>
            </div>
          )}
          {course.grading_policy && (
            <div className={styles.contentBlock}>
              <h3 className={styles.blockTitle}>Grading Policy</h3>
              <p>{course.grading_policy}</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tasksCard}>
        <div className={styles.cardHeader}>
          <ListChecks size={28} className={styles.headerIcon} />
          <h2 className={styles.tasksTitle}>Task List</h2>
        </div>
        <div className={styles.taskList}>
          {tasks.length > 0 ? (
            <>
              <div className={styles.taskHeaderRow}>
                <div className={styles.taskCell}>Task Title</div>
                <div className={styles.taskCell}>Type</div>
                <div className={styles.taskCell}>Due Date</div>
                <div className={styles.taskCell}>Priority</div>
                <div className={styles.taskCell}>Hours</div>
                <div className={`${styles.taskCell} ${styles.taskCellDesc}`}>Description</div>
              </div>
              {tasks.map(task => (
                <div key={task.id} className={styles.taskRow}>
                  <div className={styles.taskCell}>{task.title}</div>
                  <div className={styles.taskCell}>{task.type}</div>
                  <div className={styles.taskCell}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</div>
                  <div className={styles.taskCell}>
                    <span className={`${styles.priorityBadge} ${getPriorityClass(task.priority)}`}>
                      <Star size={12} />
                      {task.priority}
                    </span>
                  </div>
                  <div className={styles.taskCell}>{task.estimated_hours}</div>
                  <div className={`${styles.taskCell} ${styles.taskCellDesc}`}>{task.description}</div>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>No tasks found for this course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 