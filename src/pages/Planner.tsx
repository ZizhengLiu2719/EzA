import { coursesApi, tasksApi } from '@/api/courses';
import { Course, Task } from '@/types';
import { formatDateTime, getPriorityColor, isOverdue } from '@/utils';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { AlertTriangle, Book, BookOpen, ClipboardCheck, FileText, Loader2, Pencil, Presentation } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Planner.module.css';

const FILTERS = [
  { key: 'all', label: 'Incomplete Tasks' },
  { key: 'week', label: 'Overdue This Week' },
  { key: 'overdue', label: 'Overdue Tasks' },
  { key: 'completed', label: 'Completed' },
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

const getTaskIcon = (type: Task['type']) => {
  const props = { size: 16, style: { flexShrink: 0 } };
  switch (type) {
    case 'reading': return <BookOpen {...props} />;
    case 'assignment': return <Pencil {...props} />;
    case 'exam': return <AlertTriangle {...props} />;
    case 'project': return <ClipboardCheck {...props} />;
    case 'quiz': return <FileText {...props} />;
    case 'presentation': return <Presentation {...props} />;
    default: return <Book {...props} />;
  }
};

const Planner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  const [filter, setFilter] = useState('week');
  const [statusFilter, setStatusFilter] = useState('all');
  const calendarRef = useRef<FullCalendar>(null);
  const navigate = useNavigate();
  const taskListRef = useRef<HTMLDivElement>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showConfirmScheduleModal, setShowConfirmScheduleModal] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  const fetchTasksAndCourses = useCallback(async () => {
    setLoading(true);
    const [courseRes, taskRes] = await Promise.all([
      coursesApi.getUserCourses(),
      tasksApi.getUserTasks()
    ]);

    if (courseRes.data) {
      setCourses(courseRes.data);
    }
    
    if (taskRes.data) {
      setTasks(taskRes.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasksAndCourses();
  }, [fetchTasksAndCourses]);

  // 注册任务列表为可拖拽源
  useEffect(() => {
    if (taskListRef.current) {
      new Draggable(taskListRef.current, {
        itemSelector: `.${styles.taskItem}`,
        eventData: function (el) {
          const id = el.getAttribute('data-task-id');
          const task = tasks.find(t => t.id === id);
          if (!task || task.type === 'work_block') return {};
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
    return tasks.filter(task => {
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    });
  }, [tasks, statusFilter]);

  // 日历事件
  const calendarEvents = useMemo(() =>
    tasks.map(task => {
      const taskStart = new Date(task.due_date);
      // ALL tasks now have a duration on the calendar
      const taskEnd = new Date(taskStart.getTime() + (task.estimated_hours || 1) * 60 * 60 * 1000);

      return {
        id: task.id,
        title: task.title,
        start: taskStart,
        end: taskEnd,
        backgroundColor: getPriorityColor(task.priority),
        borderColor: getPriorityColor(task.priority),
        extendedProps: { ...task },
      };
    }),
    [tasks]
  );

  // 日历事件点击
  const handleEventClick = (info: any) => {
    setSelectedTaskId(info.event.id);
    const task = tasks.find(t => t.id === info.event.id);
    if (task) {
      setModalTask(task);
      setShowStatusModal(true);
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
        if (calendarRef.current) {
          calendarRef.current.getApi().today();
        }
      },
    },
  };

  // 拖拽到日历后，更新任务时间并同步到后端
  const handleEventReceive = async (info: any) => {
    const { event } = info;
    const newDate = event.start;
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === event.id ? { ...t, due_date: newDate.toISOString() } : t));
    
    try {
      await tasksApi.updateTask(event.id, { due_date: newDate.toISOString() });
    } catch (e) {
      setNotification({ show: true, message: 'Failed to save task time, please try again' });
      // Revert on failure
      fetchTasksAndCourses();
    }
  };

  // 日历内拖拽调整时间
  const handleEventDrop = async (info: any) => {
    const { event } = info;
    const updates = { due_date: event.start.toISOString() };
    
    const { error } = await tasksApi.updateTask(event.id, updates);

    if (error) {
      setNotification({ show: true, message: `任务更新失败: ${error.message}` });
      info.revert();
    } else {
      setTasks(prevTasks => prevTasks.map(t => t.id === event.id ? {...t, ...updates} : t));
    }
  };

  // 切换任务完成状态
  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    setShowStatusModal(false);

    try {
      await tasksApi.updateTask(task.id, { status: newStatus });
    } catch (e) {
      setNotification({ show: true, message: 'Failed to save task status, please try again' });
      // Revert on failure
      fetchTasksAndCourses();
    }
  };

  const handleAutoScheduleClick = () => {
    setShowConfirmScheduleModal(true);
  };

  const executeAutoSchedule = async () => {
    setShowConfirmScheduleModal(false);
    setIsScheduling(true);

    setTimeout(async () => {
      try {
        const tasksToSchedule = tasks
          .filter(t => t.status !== 'completed' && t.estimated_hours > 0)
          .sort((a, b) => {
            const aPrio = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
            const bPrio = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
            const aDueDate = new Date(a.due_date).getTime();
            const bDueDate = new Date(b.due_date).getTime();
            
            if (aDueDate < bDueDate) return -1;
            if (aDueDate > bDueDate) return 1;
            return bPrio - aPrio;
          });

        const busySlots = tasks.map(t => {
          const start = new Date(t.due_date);
          const duration = (t.estimated_hours || 1) * 3600 * 1000;
          return { start, end: new Date(start.getTime() + duration) };
        }).sort((a,b) => a.start.getTime() - b.start.getTime());

        const updates: { id: string, updates: Partial<Task> }[] = [];
        
        const scheduleEndLimit = new Date();
        scheduleEndLimit.setDate(scheduleEndLimit.getDate() + 21);
        const WORK_DAY_START = 9;
        const WORK_DAY_END = 22;

        let searchStart = new Date();
        if (searchStart.getMinutes() > 0) {
            searchStart.setHours(searchStart.getHours() + 1, 0, 0, 0);
        }

        for (const task of tasksToSchedule) {
          const durationMs = (task.estimated_hours || 1) * 60 * 60 * 1000;
          let placed = false;

          let tempSearchStart = new Date(searchStart);

          while (!placed && tempSearchStart < scheduleEndLimit) {
            if (tempSearchStart.getHours() >= WORK_DAY_END) {
              tempSearchStart.setDate(tempSearchStart.getDate() + 1);
              tempSearchStart.setHours(WORK_DAY_START, 0, 0, 0);
              continue;
            }
             if (tempSearchStart.getHours() < WORK_DAY_START) {
                tempSearchStart.setHours(WORK_DAY_START, 0, 0, 0);
                continue;
            }

            const proposedEnd = new Date(tempSearchStart.getTime() + durationMs);
            if (proposedEnd.getHours() > WORK_DAY_END && proposedEnd.getDate() === tempSearchStart.getDate()) {
                tempSearchStart.setDate(tempSearchStart.getDate() + 1);
                tempSearchStart.setHours(WORK_DAY_START, 0, 0, 0);
                continue;
            }

            const conflict = busySlots.find(slot => 
              tempSearchStart < slot.end && proposedEnd > slot.start
            );

            if (!conflict) {
              updates.push({ id: task.id, updates: { due_date: tempSearchStart.toISOString() } });
              
              busySlots.push({ start: new Date(tempSearchStart), end: proposedEnd });
              busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
              
              placed = true;
              searchStart = new Date(tempSearchStart);
            } else {
              tempSearchStart = new Date(conflict.end);
            }
          }
        }
        
        if (updates.length > 0) {
          const updatePromises = updates.map(u => tasksApi.updateTask(u.id, u.updates));
          const results = await Promise.all(updatePromises);
          
          const failedUpdates = results.filter(res => res.error);
          if (failedUpdates.length > 0) {
            throw new Error(`${failedUpdates.length} tasks failed to update.`);
          }

          setNotification({ show: true, message: `${updates.length}个任务已成功安排！` });
          await fetchTasksAndCourses();
        } else {
          setNotification({ show: true, message: '没有需要调度的任务，或者您的日历已满。' });
        }

      } catch (error: unknown) {
        if (error instanceof Error) {
          setNotification({ show: true, message: `智能调度失败: ${error.message}` });
        } else {
          setNotification({ show: true, message: '发生未知错误，智能调度失败。' });
        }
      } finally {
        setIsScheduling(false);
      }
    }, 100);
  };

  const handleStatusUpdate = async () => {
    if (!modalTask) return;
    const { error } = await tasksApi.updateTask(modalTask.id, { status: modalTask.status });
    if (error) {
      setNotification({ show: true, message: `任务状态更新失败: ${error.message}` });
    } else {
      fetchTasksAndCourses();
      setShowStatusModal(false);
    }
  };

  return (
    <div className={styles.plannerWrapper}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>智能任务引擎</h1>
          <button onClick={() => navigate(-1)} className={styles.backButton}>返回</button>
        </div>
        
        <div className={styles.mainContent}>
          <div className={styles.taskList} ref={taskListRef}>
            <div className={styles.taskListHeader}>
              <div className={styles.filterButtons}>
                {['all', 'pending', 'in_progress', 'completed'].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? styles.activeFilter : ''}>
                    {s === 'all' ? '全部' : s === 'pending' ? '待办' : s === 'in_progress' ? '进行中' : '已完成'}
                  </button>
                ))}
              </div>
              <button onClick={handleAutoScheduleClick} className={styles.scheduleButton} disabled={isScheduling}>
                {isScheduling ? <Loader2 className={styles.loader} /> : null}
                {isScheduling ? '正在调度...' : '一键智能调度'}
              </button>
            </div>
            <div className={styles.tasks}>
              {loading ? (
                <div className={styles.loading}>加载中...</div>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`${styles.taskItem} ${isTaskSelected(task.id) ? styles.selectedTask : ''}`}
                    onClick={() => handleTaskClick(task.id)}
                    data-task-id={task.id}
                  >
                    <div className={styles.taskTypeIcon} style={{ color: getPriorityColor(task.priority) }}>
                      {getTaskIcon(task.type)}
                    </div>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={styles.courseName}>{getCourseName(task.course_id)}</span>
                      <span className={styles.dueDate}>
                        截止于: {formatDateTime(task.due_date)}
                        {isOverdue(task.due_date) && task.status !== 'completed' && <span className={styles.overdueIndicator}>!</span>}
                      </span>
                    </div>
                    <div className={`${styles.priorityIndicator} ${styles[task.priority]}`} />
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>没有找到任务。</div>
              )}
            </div>
          </div>

          <div className={styles.calendar}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={calendarView}
              headerToolbar={headerToolbar}
              events={calendarEvents}
              droppable={true}
              editable={true}
              eventClick={handleEventClick}
              eventReceive={handleEventReceive}
              eventDrop={handleEventDrop}
              height="100%"
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="23:00:00"
              customButtons={customButtons}
              viewDidMount={(view) => setCalendarView(view.view.type)}
            />
          </div>
        </div>
      </div>

      {showStatusModal && modalTask && (
        <div className={styles.modalBackdrop} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>任务状态更新</h3>
            <p><strong>任务:</strong> {modalTask.title}</p>
            <p><strong>当前状态:</strong> {modalTask.status}</p>
            <p>您想将此任务标记为 "{modalTask.status === 'completed' ? '未完成' : '已完成'}" 吗？</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowStatusModal(false)} className={styles.cancelButton}>取消</button>
              <button onClick={() => toggleTaskStatus(modalTask)} className={styles.confirmButton}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmScheduleModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>一键智能调度确认</h3>
            <p>这将根据任务的优先级、截止日期和预估时长，自动将它们安排到日历的可用时间段。现有任务的时间将会被更新。确定吗？</p>
            <div className={styles.modalActions}>
              <button onClick={executeAutoSchedule} className={styles.confirmButton}>确定</button>
              <button onClick={() => setShowConfirmScheduleModal(false)} className={styles.cancelButton}>取消</button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>通知</h3>
            <p>{notification.message}</p>
            <div className={styles.modalActions}>
              <button onClick={() => setNotification({ show: false, message: '' })} className={styles.confirmButton}>
                好的
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner; 