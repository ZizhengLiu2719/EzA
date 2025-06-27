import BackToDashboardButton from '@/components/BackToDashboardButton'
import { useTasks } from '@/hooks/useTasks'
import { Task } from '@/types'
import { useMemo, useState } from 'react'
import styles from './Planner.module.css'

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

type WeekDay = typeof weekDays[number]

type WeekPlan = Record<WeekDay, Task[]>

type DayHours = Record<WeekDay, number>

function getWeekStart(date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // 周一为一周开始
  return d
}

function getWeekDates(): Date[] {
  const start = getWeekStart()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function scheduleTasksForWeek(tasks: Task[], maxHoursPerDay: number): WeekPlan {
  const weekDates = getWeekDates()
  const result: WeekPlan = weekDays.reduce((acc, day) => { acc[day] = []; return acc }, {} as WeekPlan)
  const dayHours: DayHours = weekDays.reduce((acc, day) => { acc[day] = 0; return acc }, {} as DayHours)
  const now = new Date()
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekTasks = tasks.filter((t: Task) => {
    if (t.status === 'completed') return false
    const due = new Date(t.due_date)
    return due >= weekStart && due <= weekEnd
  })
  weekTasks.sort((a: Task, b: Task) => {
    const ad = new Date(a.due_date).getTime(), bd = new Date(b.due_date).getTime()
    if (ad !== bd) return ad - bd
    const p = { high: 0, medium: 1, low: 2 }
    return (p[a.priority] - p[b.priority])
  })
  for (const task of weekTasks) {
    let assigned = false
    for (let i = 6; i >= 0; i--) {
      const d = weekDates[i]
      const dayStr = weekDays[i]
      if (new Date(task.due_date).toDateString() === d.toDateString() && dayHours[dayStr] + task.estimated_hours <= maxHoursPerDay) {
        result[dayStr].push(task)
        dayHours[dayStr] += task.estimated_hours
        assigned = true
        break
      }
    }
    if (!assigned) {
      for (let i = 0; i < 7; i++) {
        const dayStr = weekDays[i]
        if (dayHours[dayStr] + task.estimated_hours <= maxHoursPerDay) {
          result[dayStr].push(task)
          dayHours[dayStr] += task.estimated_hours
          assigned = true
          break
        }
      }
    }
    if (!assigned) {
      const dueIdx = weekDates.findIndex(d => new Date(task.due_date).toDateString() === d.toDateString())
      if (dueIdx >= 0) result[weekDays[dueIdx]].push(task)
    }
  }
  return result
}

const Planner = () => {
  const [maxHoursPerDay, setMaxHoursPerDay] = useState<number>(4)
  const { tasks, loading } = useTasks()
  const weekPlan = useMemo(() => scheduleTasksForWeek(tasks, maxHoursPerDay), [tasks, maxHoursPerDay])
  return (
    <div className={styles.planner} style={{ position: 'relative' }}>
      <BackToDashboardButton />
      <div className="container">
        <div className={styles.header}>
          <h1>智能学习计划</h1>
          <p>你的个性化学习时间线和任务安排</p>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>每日最大学习时长：</label>
            <input type="number" min={1} max={12} value={maxHoursPerDay} onChange={e => setMaxHoursPerDay(Number(e.target.value))} style={{ width: 60 }} /> 小时
          </div>
        </div>
        <div className={styles.plannerContent}>
          <div className={styles.sidebar}>
            <div className={styles.courseList}>
              <h3>我的课程</h3>
              <div className={styles.courseItem}>
                <span className={styles.courseName}>历史学概论</span>
                <span className={styles.taskCount}>5个任务</span>
              </div>
              <div className={styles.courseItem}>
                <span className={styles.courseName}>高等数学</span>
                <span className={styles.taskCount}>8个任务</span>
              </div>
              <div className={styles.courseItem}>
                <span className={styles.courseName}>心理学基础</span>
                <span className={styles.taskCount}>3个任务</span>
              </div>
            </div>
          </div>
          <div className={styles.mainContent}>
            <div className={styles.weekView}>
              <h2>本周计划</h2>
              <div className={styles.weekGrid}>
                {weekDays.map((day, i) => (
                  <div key={day} className={styles.dayColumn}>
                    <h4>{day}</h4>
                    <div className={styles.dayTasks}>
                      {weekPlan[day].length === 0 && <div style={{ color: '#bbb', fontSize: 14 }}>无任务</div>}
                      {weekPlan[day].map(task => (
                        <div key={task.id} className={styles.taskCard}>
                          <span className={styles.taskTitle}>{task.title}</span>
                          <span className={styles.taskTime}>{task.estimated_hours}小时</span>
                          <span className={styles.taskCourse}>{task.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Planner 