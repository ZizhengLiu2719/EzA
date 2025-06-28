# EzA - AI-Powered Learning Success System

> Upload your syllabus. I'll handle the rest.

---

## 🚦 Project Current Status & Known Issues (2024-06)

### ✅ Implemented

- Subscription system (Free/Pro/Elite, AI model permissions, quota limits, pricing, etc.)
- AI Learning Assistant (GPT-3.5/GPT-4o, multi-modal support, task context, conversation history)
- Course import, task management, course overview, review cards, weekly reports and other core features
- Supabase backend (Auth, PostgreSQL, Storage) integration with frontend
- Modern UI, responsive design, navigation and subscription access

### ⚠️ Typical Known Issues

- **AI Conversation Creation Errors**:
  - `Could not find the 'messages' column of 'ai_conversations' in the schema cache` (fixed, due to type and API inserting extra fields)
  - `violates foreign key constraint "ai_conversations_user_id_fkey"` (common cause: not logged in/logged in user not synced to users table, or invalid user_id)
- **User Login/Registration and Database Sync**:
  - Users registered through Supabase Auth don't automatically sync to public.users table, need to ensure user_id exists in users table, otherwise AI-related foreign key constraints will fail.
- **Local Development Environment**:
  - If directly manipulating database or manually inserting into users table, may cause inconsistency between auth and users table.
- **Style Resource Loading Warnings**:
  - Some environments have warnings about stylesheet loading failures, doesn't affect main functionality.

### 🛠️ Troubleshooting Suggestions

- When encountering AI assistant-related foreign key errors, first check if logged in, whether user_id exists in users table.
- If no users table record after registration/login, can manually insert a record with id consistent with auth.users.
- If other bugs or exceptions, suggest console.log related user information and provide feedback.

---

## 🌍 Language Policy

**IMPORTANT**: As of the latest update, all user-facing text in this project has been converted to English. This includes:

- All UI text and labels
- Error messages and notifications
- Form placeholders and descriptions
- Button text and navigation labels
- Modal content and tooltips
- AI assistant responses and prompts
- Documentation and help text

**Note**: Code comments remain in Chinese for developer convenience.

---

EzA is an AI-powered learning success system designed specifically for American college students, aimed at helping students succeed from the start of their courses all the way to completion.

## 💰 Subscription Plans

EzA offers three subscription tiers to meet different user needs:

### 🆓 Free Plan

- **Price**: Free
- **AI Model**: GPT-3.5 Turbo
- **Usage Limits**:
  - 50 AI conversations per month
  - 5 course uploads per month
  - Basic feature access
- **Suitable for**: New users wanting to experience EzA features

### ⭐ Pro Plan

- **Price**: $4.99/month
- **AI Model**: GPT-3.5 Turbo
- **Usage Limits**:
  - Unlimited AI conversations
  - Unlimited course uploads
  - All basic features
  - Priority customer support
- **Suitable for**: Serious students

### 🚀 Elite Plan

- **Price**: $9.99/month
- **AI Model**: GPT-4o (latest and most powerful AI model)
- **Usage Limits**:
  - Unlimited AI conversations
  - Unlimited course uploads
  - All features + advanced features
  - Priority customer support
  - Personalized learning recommendations
- **Suitable for**: Elite students pursuing the best learning experience

## 🎯 Core Features

- **Course Import Center** - Upload syllabus, textbooks, lecture notes, master entire semester structure in 1 minute
- **Smart Task Engine** - Automatically generate learning path maps, subtask breakdown, calendar sync, support task drag & drop, status switching, persistent saving
- **AI Learning Assistant** - Modern dropdown-based interface for writing guidance, STEM problem solving, reading summaries, comprehensive AI tutoring with elegant UX design
- **Weekly Feedback Coach** - Task completion rate analysis, procrastination index, personalized recommendations
- **Review & Exam Preparation** - Automatically generate review cards, practice questions, error tracking
- **Current Semester Course Overview** - View all uploaded courses, quick access to syllabus editing, detail display, deletion
- **Course Detail Display** - One-click view of all course information and task lists

## 🤖 AI Model Description

### GPT-3.5 Turbo (Free & Pro Plans)

- **Response Speed**: Fast
- **Cost**: Lower
- **Use Cases**: Daily learning Q&A, basic writing guidance, simple problem solving
- **Features**: High cost-effectiveness, suitable for most learning needs

### GPT-4o (Elite Plan)

- **Response Speed**: Faster
- **Cost**: Higher
- **Use Cases**: Complex academic problems, deep analysis, creative writing, advanced programming
- **Features**: Stronger comprehension, more accurate answers, suitable for high-demand learning tasks

## 🆕 Smart Task Engine Experience

- Calendar and task activity dual view, UI highly similar to MyStudyLife, supports day/week/month/list switching
- Tasks can be directly dragged to any time on calendar, supports dragging adjustment within calendar
- Click calendar tasks to toggle complete/incomplete status, task status syncs in real-time
- Task filtering supports "Incomplete tasks", "Overdue tasks this week", "Overdue tasks", "Completed"
- All operations (drag & drop, status switching) are persistently saved, won't be lost on refresh/re-enter page
- Supports scrollbars, compact and beautiful interface, convenient return to main interface button

## 🤖 AI Learning Assistant Experience

- **Modern Dropdown Interface**: Elegant dropdown design replacing traditional popup panels for better UX
- **AI Configuration**: Easy access to writing style, citation format, and difficulty level settings through streamlined dropdown
- **Quick Prompts**: Categorized prompt templates (Writing, STEM, Reading, Programming, General) with instant access
- **Learning Progress**: Real-time statistics showing conversations, study time, learning streak, and achievements
- **Theme-based Color Coding**:
  - AI Config: Blue theme for configuration settings
  - Quick Prompts: Amber theme for creative inspiration
  - Learning Progress: Light blue theme for analytics
- **Smooth Animations**: Fade-in effects, chevron rotations, and hover transitions for polished user experience
- **Responsive Design**: Auto-adjusts to mobile with fixed positioning and optimized touch interactions
- **Smart Interaction**: External click detection, mutual exclusion logic, and keyboard navigation support

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: CSS Modules (no Tailwind)
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Animation**: Framer Motion
- **Backend**: Supabase (Auth + PostgreSQL + Storage)
- **AI**: OpenAI GPT-3.5 Turbo / GPT-4o
- **Deployment**: Vercel

## 🚀 Quick Start

### Requirements

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Environment

```bash
npm run dev
```

App will start at http://localhost:3000

### Build Production Version

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── assets/                  # Images, icons, etc.
├── components/             # UI components + style modules + common buttons
├── pages/                  # Page components (including course details, AI assistant, review, weekly reports, etc.)
├── layouts/                # Page structure
├── styles/                 # Global styles
├── hooks/                  # Custom Hooks
├── api/                    # API request encapsulation
├── context/                # State sharing
├── utils/                  # Utility functions
├── types/                  # TypeScript types
└── main.tsx
```

## 🎨 Design Philosophy

- **PC First, Mobile Compatible** - Responsive design, prioritize desktop experience
- **Modular CSS** - Use CSS Modules, avoid style conflicts
- **Component-based Development** - Highly reusable component design
- **User Experience First** - Clean and intuitive interface design
- **All module pages have one-click return to main interface or previous level in top right corner**

## 📈 Development Plan

- [x] Project foundation architecture setup
- [x] Homepage and navigation components
- [x] User authentication pages
- [x] Basic page framework
- [x] Supabase integration
- [x] File upload functionality
- [x] AI conversation functionality
- [x] Task management system
- [x] Course syllabus parsing and editing
- [x] Course overview page
- [x] Course detail display page
- [x] Course uniqueness and deduplication
- [x] Task save deduplication (prevent duplicates)
- [x] Auto-clean Storage files when deleting courses
- [x] All module pages have return to main interface/previous level in top right corner
- [x] UI/interaction optimization
- [x] Smart task engine calendar + task dual view (similar to MyStudyLife)
- [x] Task drag to calendar, drag within calendar
- [x] Task complete/incomplete status switching
- [x] Task operation persistent saving
- [x] Task filtering logic optimization
- [x] Calendar/task UI beautification
- [x] Subscription plans and AI model restrictions
- [x] User registration auto-sync to public.users table (trigger + RLS + permission issues completely resolved)
- [x] AI foreign key constraint issues completely fixed (public.users missing causing 409/foreign key errors completely eradicated)
- [x] AI Learning Assistant UI modernization (dropdown design)
- [x] AI Config, Quick Prompts, Learning Progress dropdown implementation
- [x] Enhanced UX with smooth animations and theme-based color coding
- [x] Responsive dropdown design with external click detection
- [ ] Review system
- [ ] Data visualization
- [ ] Weekly feedback analysis
- [ ] Exam preparation features

### 🛠️ Recent Fixes and Troubleshooting Records

- Completely sorted out and fixed the issue where Supabase Auth registered users couldn't automatically sync to public.users table.
- Recreated sync trigger (on_auth_user_created) and added security definer to ensure backend service has permissions.
- Configured RLS policies to allow trigger and service account inserts.
- Checked and completed all table insert permissions, completely resolved permission denied errors.
- Completely eradicated AI-related table (like ai_conversations) foreign key constraint failure issues.
- Now supports multi-user registration, auto-sync, AI functionality barrier-free use.

### 🎨 Latest UI/UX Improvements (2024-12)

- **AI Learning Assistant UI Modernization**: Transformed AI Config, Quick Prompts, and Learning Progress from popup panels to elegant dropdown design.
- **Enhanced User Experience**: Implemented smooth fade-in animations, chevron rotation effects, and theme-based color coding for different functionalities.
- **Responsive Dropdown System**: Added external click detection for automatic closure, mutual exclusion logic, and mobile-optimized responsive design.
- **Performance Optimization**: Streamlined CSS architecture by removing redundant styles and implementing efficient component styling overrides.

## 🔧 Core Feature Implementation

### Course Syllabus Parsing

- Support PDF file upload
- AI automatic syllabus content parsing
- Generate structured task lists
- Frontend editing and saving functionality
- Database persistent storage

### Course Management

- Course list overview, detail display, editing, deletion
- New course creation and course editing
- Syllabus information persistence
- Route parameter support
- Auto-clean Storage folder and all files when deleting courses

### Course Detail Display

- Display all basic course information (name, semester, year, description, grading policy)
- Display all tasks (title, type, due date, priority, description, etc.)
- One-click return to previous level in top right corner

### Smart Task Engine

- Calendar + task dual view, UI highly similar to MyStudyLife
- Task drag to calendar, drag adjustment within calendar
- Task status switching (complete/incomplete)
- Task filtering (incomplete, overdue this week, overdue, completed)
- All operations persistently saved
- Supports scrollbars, compact and beautiful interface

### AI Integration

- OpenAI GPT-3.5 Turbo / GPT-4o API integration
- Smart syllabus parsing
- Structured data output
- Error handling and retry mechanism
- Model selection based on subscription level
- Modern dropdown-based AI interface with smooth animations
- Theme-based color coding for different AI functionalities
- Responsive design with external click detection

## 🤝 Contribution

Welcome to submit Issue and Pull Request!

## License

MIT License
