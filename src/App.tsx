import CourseDetail from '@/pages/CourseDetail'
import CourseList from '@/pages/CourseList'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Planner from '@/pages/Planner'
import Register from '@/pages/Register'
import Review from '@/pages/Review'
import Subscription from '@/pages/Subscription'
import TaskAssistant from '@/pages/TaskAssistant'
import UploadCourse from '@/pages/UploadCourse'
import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import WeeklyReport from './pages/WeeklyReport'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadCourse />} />
        <Route path="/upload-course/:courseId" element={<UploadCourse />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/assistant" element={<TaskAssistant />} />
        <Route path="/review" element={<Review />} />
        <Route path="/weekly-report" element={<WeeklyReport />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
      </Routes>
    </div>
  )
}

export default App 