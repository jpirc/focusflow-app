# FocusFlow 🎯

**Visual Planning for ADHD/Neurodivergent Brains**

A Tiimo-inspired visual planning web app with multi-day timelines, drag-and-drop scheduling, AI task breakdown, and time-block organization.

![FocusFlow Screenshot](screenshot.png)

## ✨ Features

- **Multi-day Visual Timeline** - See 2, 3, 5, or 7 days at a glance
- **Time Block Scheduling** - Morning, Afternoon, Evening, or Anytime
- **Drag & Drop** - Move tasks between days and time blocks
- **AI Task Breakdown** - Let Claude break overwhelming tasks into small, actionable steps
- **Project Organization** - Color-coded projects with progress tracking
- **Inbox** - Capture tasks without scheduling pressure
- **Task Dependencies** - Link related tasks together
- **Subtasks** - Break tasks into steps manually
- **Energy Level Matching** - Align tasks with your energy patterns
- **Keyboard Shortcuts** - Quick navigation and task management
- **Undo/Redo** - Easily reverse changes

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand (state management)
- React Query (server state)
- Framer Motion (animations)

**Backend:**
- Python FastAPI
- PostgreSQL (database)
- Anthropic Claude API (AI features)

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/focusflow.git
cd focusflow
```

### 2. Set up the Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY (optional for AI features)

# Run the server
uvicorn main:app --reload --port 8000
```

### 3. Set up the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run the dev server
npm run dev
```

### 4. Open the app
Visit `http://localhost:5173` in your browser!

---

## 🌐 Deployment Guide

### Option A: Vercel (Frontend) + Railway (Backend) - RECOMMENDED

This is the easiest setup with generous free tiers.

#### Step 1: Deploy Backend to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up with GitHub

2. **Create New Project**:
   ```bash
   # In your terminal, install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Navigate to backend folder
   cd focusflow/backend
   
   # Initialize and deploy
   railway init
   railway up
   ```

3. **Add PostgreSQL**:
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway automatically adds `DATABASE_URL` to your environment

4. **Set Environment Variables** in Railway dashboard:
   ```
   JWT_SECRET=generate-a-random-secret-here
   ANTHROPIC_API_KEY=sk-ant-api03-your-key (optional)
   FRONTEND_URL=https://your-app.vercel.app (update after Vercel deploy)
   ```

5. **Get your Backend URL**: It'll be something like `https://focusflow-backend.up.railway.app`

#### Step 2: Deploy Frontend to Vercel

1. **Push code to GitHub** (if not already):
   ```bash
   cd focusflow
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/focusflow.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project" → Import your `focusflow` repo
   - Set **Root Directory** to `frontend`
   - Add Environment Variable:
     ```
     VITE_API_URL=https://your-railway-backend-url.up.railway.app/api
     ```
   - Click "Deploy"

3. **Update Railway CORS**: Go back to Railway and update `FRONTEND_URL` to your Vercel URL

#### Step 3: Done! 🎉
Your app is live at your Vercel URL!

---

### Option B: Render (Full Stack)

1. **Create Render Account**: [render.com](https://render.com)

2. **Deploy Backend**:
   - New → Web Service → Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables

3. **Deploy Frontend**:
   - New → Static Site → Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add `VITE_API_URL` environment variable

4. **Add PostgreSQL**:
   - New → PostgreSQL
   - Copy connection string to backend environment

---

### Option C: Self-Hosted (VPS/Docker)

```bash
# Clone on your server
git clone https://github.com/yourusername/focusflow.git
cd focusflow

# Use Docker Compose (create docker-compose.yml)
docker-compose up -d
```

---

## 🔑 Environment Variables Reference

### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `ANTHROPIC_API_KEY` | No | For AI task breakdown feature |
| `FRONTEND_URL` | Yes | Your frontend URL (for CORS) |
| `REDIS_URL` | No | Redis connection (for caching) |

### Frontend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Your backend API URL |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Quick add task |
| `T` | Jump to today |
| `←` / `→` | Navigate days |
| `⌘Z` | Undo |
| `⌘Y` | Redo |
| `C` | Complete selected task |
| `S` | Start selected task |
| `Esc` | Deselect / Close modal |

---

## 🤖 AI Task Breakdown

The AI breakdown feature uses Claude to help break overwhelming tasks into small, actionable steps:

1. Click the `⋯` menu on any task
2. Select "Break Down with AI"
3. Optionally add context (time available, energy level, etc.)
4. Review and select which steps to add
5. Steps are added as subtasks to your task

**Note**: Requires `ANTHROPIC_API_KEY` in backend environment. Without it, you'll get helpful mock responses.

---

## 📁 Project Structure

```
focusflow/
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand store
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utilities
│   │   ├── App.tsx        # Main app
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── main.py            # FastAPI application
│   ├── requirements.txt
│   └── railway.toml       # Railway deployment
│
└── README.md
```

---

## 🛣️ Roadmap

- [ ] User authentication (sign up / login)
- [ ] Persistent database storage
- [ ] Recurring tasks
- [ ] Calendar integrations (Google, Apple)
- [ ] Mobile PWA
- [ ] Focus timer with Pomodoro
- [ ] Daily/weekly reviews
- [ ] Data export

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

## 🙏 Acknowledgments

- Inspired by [Tiimo](https://www.tiimoapp.com/) - Apple's App of the Year 2024
- Built with [Claude](https://anthropic.com) AI assistance
- Icons from [Lucide](https://lucide.dev)

---

**Made with 💜 for neurodivergent brains**
