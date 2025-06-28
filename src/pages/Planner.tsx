import { courseParseApi, coursesApi } from '@/api/courses';
import { Course, Task } from '@/types';
import { formatDateTime, getPriorityColor, isOverdue } from '@/utils';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Planner.module.css';

const FILTERS = [
  { key: 'all', label: '全部任务' },
  { key: 'week', label: '本周任务' },
  { key: 'overdue', label: '逾期任务' },
  { key: 'completed', label: '已完成' },
];

const getWeekRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const Planner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  const [filter, setFilter] = useState('week');
  const [calendarRef, setCalendarRef] = useState<any>(null);
  const navigate = useNavigate();
  const taskListRef = useRef<HTMLDivElement>(null);

  // 获取所有课程和任务
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const courseRes = await coursesApi.getUserCourses();
      if (courseRes.error) return setLoading(false);
      setCourses(courseRes.data);
      let allTasks: Task[] = [];
      for (const course of courseRes.data) {
        const taskRes = await courseParseApi.getCourseTasks(course.id);
        if (taskRes.data) {
          allTasks = allTasks.concat(taskRes.data.map((t: Task) => ({ ...t, course_id: course.id })));
        }
      }
      setTasks(allTasks);
      setLoading(false);
    };
    fetchData();
  }, []);

  // 注册任务列表为可拖拽源
  useEffect(() => {
    if (taskListRef.current) {
      new Draggable(taskListRef.current, {
        itemSelector: `.${styles.taskItem}`,
        eventData: function (el) {
          const id = el.getAttribute('data-task-id');
          const task = tasks.find(t => t.id === id);
          if (!task) return {};
          return {
            id: task.id,
            title: task.title,
            duration: { hours: Math.max(1, Math.round(task.estimated_hours || 1)) },
            extendedProps: { ...task },
          };
        },
      });
    }
  }, [tasks]);

  // 任务筛选
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const { start, end } = getWeekRange();
    switch (filter) {
      case 'week':
        return tasks.filter(t => {
          const due = new Date(t.due_date);
          return due >= start && due <= end;
        });
      case 'overdue':
        return tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      default:
        return tasks;
    }
  }, [tasks, filter]);

  // 日历事件
  const calendarEvents = useMemo(() =>
    tasks.map(task => ({
      id: task.id,
      title: `${task.title} (${task.type})`,
      start: task.due_date,
      end: task.due_date,
      backgroundColor: getPriorityColor(task.priority),
      borderColor: getPriorityColor(task.priority),
      extendedProps: { ...task },
    })),
    [tasks]
  );

  // 日历事件点击
  const handleEventClick = (info: any) => {
    setSelectedTaskId(info.event.id);
    const task = tasks.find(t => t.id === info.event.id);
    if (task) {
      document.getElementById(`task-${task.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 任务点击
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // 任务高亮
  const isTaskSelected = (taskId: string) => selectedTaskId === taskId;

  // 课程名查找
  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || '';

  // FullCalendar headerToolbar 配置
  const headerToolbar = {
    left: '',
    center: 'prev today next',
    right: 'title'
  };

  // customButtons 配置
  const customButtons = {
    today: {
      text: 'Today',
      click: () => {
        if (calendarRef) {
          calendarRef.getApi().today();
        }
      },
    },
  };

  // 拖拽到日历后，更新任务时间
  const handleEventReceive = (info: any) => {
    const { event } = info;
    const newDate = event.start;
    setTasks(prev => prev.map(t => t.id === event.id ? { ...t, due_date: newDate.toISOString() } : t));
    // 可选：同步到后端
    // courseParseApi.updateTask(event.id, { due_date: newDate.toISOString() });
  };

  // 日历内拖拽调整时间
  const handleEventDrop = (info: any) => {
    const { event } = info;
    const newDate = event.start;
    setTasks(prev => prev.map(t => t.id === event.id ? { ...t, due_date: newDate.toISOString() } : t));
    // 可选：同步到后端
    // courseParseApi.updateTask(event.id, { due_date: newDate.toISOString() });
  };

  return (
    <div className={styles.smartPlannerRoot}>
      <button className={styles.backToMenuBtn} onClick={() => navigate('/dashboard')}>返回主界面</button>
      <div className={styles.leftPanel}>
        <div className={styles.calendarHeader}>
          <span className={styles.title}>日历</span>
          <div className={styles.viewSwitch}>
            <button className={calendarView === 'dayGridMonth' ? styles.active : ''} onClick={() => setCalendarView('dayGridMonth')}>月</button>
            <button className={calendarView === 'timeGridWeek' ? styles.active : ''} onClick={() => setCalendarView('timeGridWeek')}>周</button>
            <button className={calendarView === 'timeGridDay' ? styles.active : ''} onClick={() => setCalendarView('timeGridDay')}>天</button>
            <button className={calendarView === 'listWeek' ? styles.active : ''} onClick={() => setCalendarView('listWeek')}>列表</button>
          </div>
        </div>
        <div className={styles.mslCalendarToolbarWrap}>
          <FullCalendar
            ref={ref => setCalendarRef(ref)}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={headerToolbar}
            customButtons={customButtons}
            height="auto"
            events={calendarEvents}
            eventClick={handleEventClick}
            eventClassNames={arg => [styles.calendarEvent, isTaskSelected(arg.event.id) ? styles.selectedEvent : '']}
            datesSet={arg => setCalendarView(arg.view.type)}
            buttonText={{ today: 'Today' }}
            droppable={true}
            editable={true}
            eventReceive={handleEventReceive}
            eventDrop={handleEventDrop}
          />
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.tasksHeader}>
          <span className={styles.title}>任务活动</span>
          <div className={styles.filterBar}>
            {FILTERS.map(f => (
              <button key={f.key} className={filter === f.key ? styles.active : ''} onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>
        <div className={styles.taskList} ref={taskListRef}>
          {loading ? <div className={styles.loading}>加载中...</div> :
            filteredTasks.length === 0 ? <div className={styles.empty}>暂无任务</div> :
              filteredTasks.map(task => (
                <div
                  key={task.id}
                  id={`task-${task.id}`}
                  data-task-id={task.id}
                  className={[
                    styles.taskItem,
                    isTaskSelected(task.id) ? styles.selectedTask : '',
                    isOverdue(task.due_date) && task.status !== 'completed' ? styles.overdue : '',
                    styles[task.priority],
                  ].join(' ')}
                  onClick={() => handleTaskClick(task.id)}
                  draggable
                  style={{ cursor: 'grab' }}
                >
                  <div className={styles.taskTitleRow}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.taskType}>[{task.type}]</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <span className={styles.courseName}>{getCourseName(task.course_id)}</span>
                    <span className={styles.dueDate}>{formatDateTime(task.due_date)}</span>
                    <span className={styles.status}>{task.status === 'completed' ? '✅ 已完成' : isOverdue(task.due_date) ? '⚠️ 逾期' : ''}</span>
                  </div>
                  {task.description && <div className={styles.taskDesc}>{task.description}</div>}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
};

export default Planner; 