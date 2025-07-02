import { useCourses } from '@/hooks/useCourses'
import { Edit, Eye, Home, PlusCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './CourseList.module.css'

const CourseList = () => {
  const { courses, loading, error, deleteCourse } = useCourses()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean
    id?: string
  }>({ isOpen: false })

  const handleDeleteClick = (courseId: string) => {
    setShowDeleteConfirm({ isOpen: true, id: courseId })
  }

  const handleConfirmDelete = async () => {
    if (showDeleteConfirm.id) {
      await deleteCourse(showDeleteConfirm.id)
      setShowDeleteConfirm({ isOpen: false })
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm({ isOpen: false })
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
        <Home size={18} />
        <span>Return to Main</span>
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>My Course Syllabi</h1>
        <Link to="/upload" className={styles.uploadButton}>
          <PlusCircle size={20} />
          <span>Upload New Syllabus</span>
        </Link>
      </div>

      <div className={styles.content}>
        {loading && <div className={styles.loader}></div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && (
          <div className={styles.courseList}>
            <div className={styles.listHeader}>
              <div className={styles.headerName}>Course Name</div>
              <div className={styles.headerSemester}>Semester</div>
              <div className={styles.headerYear}>Year</div>
              <div className={styles.headerActions}>Actions</div>
            </div>
            {courses.length > 0 ? (
              courses.map(course => (
                <div key={course.id} className={styles.courseRow}>
                  <div className={styles.cellName}>{course.name}</div>
                  <div className={styles.cellSemester}>{course.semester}</div>
                  <div className={styles.cellYear}>{course.year}</div>
                  <div className={styles.cellActions}>
                    <button onClick={() => navigate(`/courses/${course.id}`)} className={`${styles.actionButton} ${styles.viewButton}`} title="View">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => navigate(`/upload-course/${course.id}`)} className={`${styles.actionButton} ${styles.editButton}`} title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(course.id)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No courses yet. Upload your first syllabus to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirm Deletion</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete this course syllabus? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button onClick={handleCancelDelete} className={`${styles.modalButton} ${styles.modalButtonSecondary}`}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className={`${styles.modalButton} ${styles.modalButtonDanger}`}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseList 