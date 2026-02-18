# Dopatika 🎯

A visual planning app designed for ADHD, autism, and anyone who needs flexible structure. Built with Next.js 14, TypeScript, and Tailwind CSS.

![Dopatika Screenshot](screenshot.png)

## ✨ Features

### Core Functionality
- **Multi-day visual timeline** - View 1, 3, 5, or 7 days at once, plus month calendar
- **Time block scheduling** - Morning, Afternoon, Evening, and Anytime slots
- **Drag & drop interface** - Move tasks between days and time blocks
- **Project organization** - Group related tasks with color-coded projects
- **Task dependencies** - Link tasks that depend on each other
- **Subtask breakdown** - Break large tasks into manageable steps with inline editing
- **Unscheduled inbox** - Capture tasks without immediate scheduling
- **Completed tasks section** - Per-day "Done" section with restore capability
- **Hover tooltips** - View task details on hover without opening modal

### AI-Powered Features
- **Smart task breakdown** - AI analyzes your task and suggests subtasks
- **Time estimation** - Get realistic time estimates for each step
- **Getting started tips** - Contextual advice to overcome procrastination

### ADHD-Friendly Design
- **Energy level matching** - Match high-energy tasks to morning, low-energy to evening
- **Priority indicators** - Visual badges for Low, Medium, High, and Urgent
- **Progress tracking** - See completion rates per day and project
- **Gentle visual design** - Calming colors and smooth animations
- **Reduced motion support** - Respects system accessibility preferences

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/focusflow.git
cd focusflow

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/focusflow)

### Option 2: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 3: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel auto-detects Next.js and deploys

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📁 Project Structure

```
focusflow/
├── app/
│   ├── page.tsx          # Main application
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # Reusable components (future)
├── lib/                  # Utilities (future)
├── public/               # Static assets
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🗺 Architecture + Roadmap

Roadmap and architecture are maintained in a single canonical document:

- `/Users/jonathanpirc/Desktop/Apps/focusflow-app/docs/MASTER_ARCHITECTURE_ROADMAP.md`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Database (for Phase 2+)
DATABASE_URL=postgresql://...

# Authentication (for Phase 2+)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# AI (for Phase 4+)
ANTHROPIC_API_KEY=your-api-key

# Optional
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love for the neurodivergent community
- Icons by [Lucide](https://lucide.dev/)

---

Made with 💜 for brains that work differently
