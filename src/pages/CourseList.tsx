import BackToDashboardButton from '@/components/BackToDashboardButton';
import { useCourses } from '@/hooks/useCourses';
import { Link } from 'react-router-dom';

const CourseList = () => {
  const { courses, loading, error, deleteCourse, fetchCourses } = useCourses();

  const handleDelete = async (courseId: string) => {
    const ok = window.confirm('确定要删除该课程 syllabus 吗？此操作不可恢复！');
    if (!ok) return;
    const success = await deleteCourse(courseId);
    if (success) {
      fetchCourses();
    } else {
      alert('删除失败，请重试');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative' }}>
      <BackToDashboardButton />
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>我的课程 Syllabus</h1>
      <div style={{ marginBottom: 24 }}>
        <Link to="/upload">
          <button style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>上传新syllabus</button>
        </Link>
      </div>
      {loading && <div>加载中...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && courses.length === 0 && <div>暂无课程，请先上传syllabus。</div>}
      {!loading && courses.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9fafb' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>课程名称</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>学期</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>年份</th>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 8px' }}>{course.name}</td>
                <td style={{ padding: '10px 8px' }}>{course.semester}</td>
                <td style={{ padding: '10px 8px' }}>{course.year}</td>
                <td style={{ padding: '10px 8px', display: 'flex', gap: 8 }}>
                  <Link to={`/courses/${course.id}`}><button style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, cursor: 'pointer' }}>展示</button></Link>
                  <Link to={`/upload-course/${course.id}`}><button style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, cursor: 'pointer' }}>编辑syllabus</button></Link>
                  <button onClick={() => handleDelete(course.id)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, cursor: 'pointer' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CourseList; 