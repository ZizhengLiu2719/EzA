import { coursesApi, tasksApi } from '@/api/courses';
import { Course, Task } from '@/types';
import { formatDateTime, getPriorityColor, isOverdue } from '@/utils';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { AlertTriangle, Book, BookOpen, ClipboardCheck, FileText, Loader2, Lock, Pencil, Presentation, Unlock } from 'lucide-react';
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
  const [showUnscheduleConfirm, setShowUnscheduleConfirm] = useState(false);
  const [eventToUnschedule, setEventToUnschedule] = useState<any>(null);
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

  // 任务筛选
  const filteredTasks = useMemo(() => {
    const getWeekRange = () => {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    };

    switch (statusFilter) {
      case 'unfinished':
        return tasks.filter(task => task.status !== 'completed');
      case 'due_this_week': {
        const { start, end } = getWeekRange();
        return tasks.filter(task => {
          const dueDate = new Date(task.due_date);
          return dueDate >= start && dueDate <= end && task.status !== 'completed';
        });
      }
      case 'overdue':
        return tasks.filter(task => new Date(task.due_date) < new Date() && task.status !== 'completed');
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      default:
        return tasks.filter(task => task.status !== 'completed');
    }
  }, [tasks, statusFilter]);

  useEffect(() => {
    const containerEl = taskListRef.current;
    if (containerEl) {
      const draggable = new Draggable(containerEl, {
        itemSelector: `.${styles.taskItem}:not(.${styles.taskScheduled})`,
        eventData: function(eventEl) {
          const taskId = eventEl.dataset.taskId;
          const task = tasks.find(t => t.id === taskId);
          if (!task) return null;
          
          return {
            id: task.id,
            title: task.title,
            duration: { hours: task.estimated_hours || 1 },
            extendedProps: { ...task }
          };
        }
      });
      return () => draggable.destroy();
    }
  }, [tasks, filteredTasks]);

  // 日历事件
  const calendarEvents = useMemo(() =>
    tasks
      .filter(task => task.scheduled_start_time && task.status !== 'completed')
      .map(task => {
        const taskStart = new Date(task.scheduled_start_time!);
        const taskEnd = new Date(taskStart.getTime() + (task.estimated_hours || 1) * 60 * 60 * 1000);

        const returnVal = {
          id: task.id,
          title: task.title,
          start: taskStart,
          end: taskEnd,
          backgroundColor: getPriorityColor(task.priority),
          borderColor: getPriorityColor(task.priority),
          classNames: task.is_locked ? [styles.lockedEvent] : [],
          extendedProps: { ...task },
        };
        return returnVal;
    }),
    [tasks]
  );

  // 日历事件点击
  const handleEventClick = (info: any) => {
    const task = tasks.find(t => t.id === info.event.id);
    if (task) {
      setSelectedTaskId(info.event.id);
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
    const task = tasks.find(t => t.id === event.id);

    if (!task) {
      event.remove();
      return;
    }

    if (task.scheduled_start_time) {
      setNotification({ show: true, message: 'This task is already scheduled. To reschedule, please drag it on the calendar.' });
      event.remove();
      return;
    }

    if (task.is_locked) {
      setNotification({ show: true, message: 'Cannot schedule a locked task.' });
      event.remove();
      return;
    }
    
    const newStartTime = event.start;
    const taskDuration = (task.estimated_hours || 1) * 60 * 60 * 1000;
    const newEndTime = new Date(newStartTime.getTime() + taskDuration);
    const dueDate = new Date(task.due_date);

    if (newEndTime > dueDate) {
      setNotification({ show: true, message: `Cannot schedule task past its due date (${dueDate.toLocaleString()}).` });
      event.remove();
      return;
    }

    const updates = { scheduled_start_time: newStartTime.toISOString() };
    setTasks(prevTasks => prevTasks.map(t => t.id === event.id ? {...t, ...updates} : t));

    const { error } = await tasksApi.updateTask(event.id, updates);
    if (error) {
      setNotification({ show: true, message: `Failed to schedule task: ${(error as any).message}` });
      await fetchTasksAndCourses();
    }
  };

  // 日历内拖拽调整时间
  const handleEventDrop = async (info: any) => {
    const { event } = info;
    const task = tasks.find(t => t.id === event.id);

    if (!task) return;

    if (task.is_locked) {
      setNotification({ show: true, message: 'Cannot move a locked task. Please unlock it first.' });
      info.revert();
      return;
    }

    const newStartTime = event.start;
    const taskDuration = (task.estimated_hours || 1) * 60 * 60 * 1000;
    const newEndTime = new Date(newStartTime.getTime() + taskDuration);
    const dueDate = new Date(task.due_date);

    if (newEndTime > dueDate) {
      setNotification({ show: true, message: `Cannot schedule task past its due date (${dueDate.toLocaleString()}).` });
      info.revert();
      return;
    }

    const updates = { scheduled_start_time: newStartTime.toISOString() };
    const { error } = await tasksApi.updateTask(event.id, updates);

    if (error) {
      setNotification({ show: true, message: `Failed to update task: ${(error as any).message}` });
      info.revert();
    } else {
      setTasks(prevTasks => prevTasks.map(t => t.id === event.id ? {...t, ...updates} : t));
    }
  };

  const handleEventDragStop = async (info: any) => {
    const taskListEl = taskListRef.current;
    if (!taskListEl) return;

    const taskListRect = taskListEl.getBoundingClientRect();
    const { clientX, clientY } = info.jsEvent;

    if (
      clientX >= taskListRect.left &&
      clientX <= taskListRect.right &&
      clientY >= taskListRect.top &&
      clientY <= taskListRect.bottom
    ) {
      setEventToUnschedule(info.event);
      setShowUnscheduleConfirm(true);
    }
  };

  const executeUnschedule = async () => {
    if (!eventToUnschedule) return;

    const event = eventToUnschedule;
    const updates = { scheduled_start_time: null, is_locked: false };
        
    setTasks(prevTasks => prevTasks.map(t => t.id === event.id ? { ...t, ...updates } : t));
    
    const { error } = await tasksApi.updateTask(event.id, updates);
    if (error) {
      setNotification({ show: true, message: `Failed to unschedule task: ${(error as any).message}` });
      fetchTasksAndCourses();
    } else {
      setNotification({ show: true, message: `Task "${event.title}" has been unscheduled.` });
    }
    
    // Reset state and close modal
    setEventToUnschedule(null);
    setShowUnscheduleConfirm(false);
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
        // 筛选出需要被安排的任务 (未完成、有预估时长、未被安排、且未锁定)
        const tasksToSchedule = tasks
          .filter(t => t.status !== 'completed' && t.estimated_hours > 0 && !t.scheduled_start_time && !t.is_locked)
          .sort((a, b) => {
            // 优先处理截止日期靠前的，同日截止的，优先级高的优先
            const aDueDate = new Date(a.due_date).getTime();
            const bDueDate = new Date(b.due_date).getTime();
            if (aDueDate !== bDueDate) return aDueDate - bDueDate;
            
            const aPrio = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
            const bPrio = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
            if (aPrio !== bPrio) return bPrio - aPrio;

            // 对于截止日期和优先级都相同的任务，加入随机性
            return Math.random() - 0.5;
          });

        // 找出日历上已经被占用的时间段
        const busySlots = tasks
          .filter(t => t.scheduled_start_time)
          .map(t => {
            const start = new Date(t.scheduled_start_time!);
            const duration = (t.estimated_hours || 1) * 3600 * 1000;
            return { start, end: new Date(start.getTime() + duration) };
          }).sort((a,b) => a.start.getTime() - b.start.getTime());

        const updates: { id: string, updates: Partial<Task> }[] = [];
        
        const WORK_DAY_START = 9;
        const WORK_DAY_END = 22;

        let searchStart = new Date();
        if (searchStart.getHours() >= WORK_DAY_END || searchStart.getHours() < WORK_DAY_START) {
          searchStart.setDate(searchStart.getDate() + 1);
          searchStart.setHours(WORK_DAY_START, 0, 0, 0);
        } else if (searchStart.getMinutes() > 0 || searchStart.getSeconds() > 0) {
          searchStart.setHours(searchStart.getHours() + 1, 0, 0, 0);
        }

        for (const task of tasksToSchedule) {
          const durationMs = (task.estimated_hours || 1) * 60 * 60 * 1000;
          let placed = false;
          let tempSearchStart = new Date(searchStart);
          const dueDate = new Date(task.due_date);

          while (!placed && tempSearchStart < dueDate) {
            if (tempSearchStart.getHours() >= WORK_DAY_END) {
              tempSearchStart.setDate(tempSearchStart.getDate() + 1);
              tempSearchStart.setHours(WORK_DAY_START, 0, 0, 0);
              continue;
            }

            const proposedEnd = new Date(tempSearchStart.getTime() + durationMs);

            // 检查是否超过了当天的学习时间
            if (proposedEnd.getHours() > WORK_DAY_END || (proposedEnd.getDate() !== tempSearchStart.getDate() && proposedEnd.getHours() !== 0)) {
                tempSearchStart.setDate(tempSearchStart.getDate() + 1);
                tempSearchStart.setHours(WORK_DAY_START, 0, 0, 0);
                continue;
            }
            
            // 检查是否超过了截止日期
            if (proposedEnd > dueDate) {
              break; // 无法在该任务的截止日期前找到位置
            }

            const conflict = busySlots.find(slot => 
              tempSearchStart < slot.end && proposedEnd > slot.start
            );

            if (!conflict) {
              const newScheduledTime = { scheduled_start_time: tempSearchStart.toISOString() };
              updates.push({ id: task.id, updates: newScheduledTime });
              
              busySlots.push({ start: new Date(tempSearchStart), end: proposedEnd });
              busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
              
              placed = true;
              searchStart = new Date(tempSearchStart.getTime() + 60000); // Move search start slightly forward
            } else {
              tempSearchStart = new Date(conflict.end.getTime() + 60000); // Jump to after the conflicting block
            }
          }
        }
        
        if (updates.length > 0) {
          const updatePromises = updates.map(u => tasksApi.updateTask(u.id, u.updates));
          await Promise.all(updatePromises);
          
          setNotification({ show: true, message: `${updates.length} tasks scheduled successfully!` });
          await fetchTasksAndCourses();
        } else {
          setNotification({ show: true, message: 'No tasks to schedule, or your calendar is full.' });
        }

      } catch (error: unknown) {
        if (error instanceof Error) {
          setNotification({ show: true, message: `Auto-schedule failed: ${error.message}` });
        } else {
          setNotification({ show: true, message: 'Auto-schedule failed due to an unknown error.' });
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
      setNotification({ show: true, message: `Failed to update task status: ${(error as any).message}` });
    } else {
      fetchTasksAndCourses();
      setShowStatusModal(false);
    }
  };

  const handleToggleLock = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newLockedState = !task.is_locked;
    
    // Optimistic UI update
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, is_locked: newLockedState } : t));

    const { error } = await tasksApi.updateTask(taskId, { is_locked: newLockedState });

    if (error) {
      setNotification({ show: true, message: 'Failed to update lock status, please try again.' });
      // Revert on failure
      setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, is_locked: !newLockedState } : t));
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const task = eventInfo.event.extendedProps;
    return (
      <div className={styles.eventContentWrapper}>
        <div className={styles.eventText}>
          <strong>{eventInfo.timeText}</strong>
          <p>{eventInfo.event.title}</p>
        </div>
        <button
          className={styles.eventLockButton}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleLock(task.id);
          }}
        >
          {task.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.plannerWrapper}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Smart Task Engine</h1>
          <button onClick={() => navigate(-1)} className={styles.backButton}>Back</button>
        </div>
        
        <div className={styles.mainContent}>
          <div className={styles.taskList} ref={taskListRef}>
            <div className={styles.taskListHeader}>
              <h2>Smart Task Engine</h2>
              <div className={styles.filterButtons}>
                {[
                  { key: 'unfinished', label: 'Incomplete' },
                  { key: 'due_this_week', label: 'Due This Week' },
                  { key: 'overdue', label: 'Overdue' },
                  { key: 'completed', label: 'Completed' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setStatusFilter(f.key)} className={statusFilter === f.key ? styles.activeFilter : ''}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button onClick={handleAutoScheduleClick} className={styles.scheduleButton} disabled={isScheduling}>
                {isScheduling ? <Loader2 className={styles.loader} /> : null}
                {isScheduling ? 'Scheduling...' : 'Auto-Schedule'}
              </button>
            </div>
            <div className={styles.tasks}>
              {loading ? (
                <div className={styles.loading}>Loading...</div>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`${styles.taskItem} ${isTaskSelected(task.id) ? styles.selectedTask : ''} ${task.scheduled_start_time ? styles.taskScheduled : ''}`}
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
                        Due: {formatDateTime(task.due_date)}
                        {isOverdue(task.due_date) && task.status !== 'completed' && <span className={styles.overdueIndicator}>!</span>}
                      </span>
                    </div>
                    <div className={`${styles.priorityIndicator} ${styles[task.priority]}`} />
                    <div className={styles.taskActions}>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleLock(task.id); }} className={styles.lockButton}>
                        {task.is_locked ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <div className={styles.taskStatus} onClick={(e) => { e.stopPropagation(); setModalTask(task); setShowStatusModal(true); }}>
                        {task.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No tasks found.</div>
              )}
            </div>
          </div>

          <div className={styles.calendar}>
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              eventContent={renderEventContent}
              eventDrop={handleEventDrop}
              eventDragStop={handleEventDragStop}
              eventReceive={handleEventReceive}
              eventClick={handleEventClick}
              editable={true}
              droppable={true}
            />
          </div>
        </div>
      </div>

      {showStatusModal && modalTask && (
        <div className={styles.modalBackdrop} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Update Task Status</h3>
            <p><strong>Task:</strong> {modalTask.title}</p>
            <p><strong>Current Status:</strong> {modalTask.status}</p>
            <p>Would you like to mark this task as "{modalTask.status === 'completed' ? 'Incomplete' : 'Completed'}"?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowStatusModal(false)} className={styles.cancelButton}>Cancel</button>
              <button onClick={() => toggleTaskStatus(modalTask)} className={styles.confirmButton}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmScheduleModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>Confirm Auto-Schedule</h3>
            <p>This will automatically schedule tasks into available calendar slots based on priority, due date, and estimated time. Existing scheduled tasks may be moved. Are you sure?</p>
            <div className={styles.modalActions}>
              <button onClick={executeAutoSchedule} className={styles.confirmButton}>Confirm</button>
              <button onClick={() => setShowConfirmScheduleModal(false)} className={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showUnscheduleConfirm && eventToUnschedule && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>Unschedule Task</h3>
            <p>{`Are you sure you want to remove "${eventToUnschedule.title}" from the calendar?`}</p>
            <div className={styles.modalActions}>
              <button onClick={executeUnschedule} className={styles.confirmButton}>Confirm</button>
              <button onClick={() => { setShowUnscheduleConfirm(false); setEventToUnschedule(null); }} className={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>Notification</h3>
            <p>{notification.message}</p>
            <div className={styles.modalActions}>
              <button onClick={() => setNotification({ show: false, message: '' })} className={styles.confirmButton}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner; 