import { courseParseApi, coursesApi } from '@/api/courses';
import BackButton from '@/components/BackButton';
import { Course, Task } from '@/types';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const infoBoxStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: 32,
  margin: '40px auto',
  maxWidth: 900,
  position: 'relative',
};

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
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
        if (!found) throw new Error('未找到该课程');
        setCourse(found);
        const tasksRes = await courseParseApi.getCourseTasks(courseId!);
        setTasks(tasksRes.data || []);
      } catch (err: any) {
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchData();
  }, [courseId]);

  if (loading) return <div style={infoBoxStyle}><BackButton /><div>加载中...</div></div>;
  if (error) return <div style={infoBoxStyle}><BackButton /><div style={{ color: 'red' }}>{error}</div></div>;
  if (!course) return null;

  return (
    <div style={infoBoxStyle}>
      <BackButton />
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>课程详情</h1>
      <div style={{ marginBottom: 20 }}>
        <strong>课程名称：</strong>{course.name}<br />
        <strong>学期：</strong>{course.semester} <strong>年份：</strong>{course.year}<br />
        {course.description && <><strong>课程描述：</strong>{course.description}<br /></>}
        {course.grading_policy && <><strong>评分政策：</strong>{course.grading_policy}<br /></>}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: '24px 0 12px' }}>任务列表</h2>
      {tasks.length === 0 ? <div>暂无任务</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9fafb' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>任务标题</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>类型</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>截止日期</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>优先级</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>预计耗时(小时)</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>任务描述</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px' }}>{task.title}</td>
                <td style={{ padding: '8px' }}>{task.type}</td>
                <td style={{ padding: '8px' }}>{task.due_date ? (task.due_date.length > 10 ? task.due_date.slice(0, 10) : task.due_date) : ''}</td>
                <td style={{ padding: '8px' }}>{task.priority}</td>
                <td style={{ padding: '8px' }}>{task.estimated_hours}</td>
                <td style={{ padding: '8px' }}>{task.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CourseDetail; 