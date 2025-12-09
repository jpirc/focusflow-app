# FocusFlow 🎯

A visual planning app designed for ADHD, autism, and anyone who needs flexible structure. Built with Next.js 14, TypeScript, and Tailwind CSS.

![FocusFlow Screenshot](screenshot.png)

## ✨ Features

### Core Functionality
- **Multi-day visual timeline** - View 2, 3, or 5 days at once
- **Time block scheduling** - Morning, Afternoon, Evening, and Anytime slots
- **Drag & drop interface** - Move tasks between days and time blocks
- **Project organization** - Group related tasks with color-coded projects
- **Task dependencies** - Link tasks that depend on each other
- **Subtask breakdown** - Break large tasks into manageable steps
- **Unscheduled inbox** - Capture tasks without immediate scheduling

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

## 🗺 Roadmap

### Phase 1: MVP ✅
- [x] Multi-day timeline view
- [x] Time block scheduling
- [x] Drag and drop
- [x] Project organization
- [x] Task dependencies
- [x] AI task breakdown (simulated)

### Phase 2: User Accounts (Next)
- [ ] Email/password authentication
- [ ] Google/Apple OAuth
- [ ] User preferences storage
- [ ] Cloud sync

### Phase 3: Backend API
- [ ] PostgreSQL database
- [ ] FastAPI/Next.js API routes
- [ ] Real-time sync with WebSockets

### Phase 4: AI Integration
- [ ] Claude API for smart breakdown
- [ ] Voice-to-task input
- [ ] Smart scheduling suggestions

### Phase 5: Advanced Features
- [ ] Push notifications
- [ ] Calendar integrations
- [ ] Mobile app (React Native)
- [ ] Collaboration features

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

- Inspired by [Tiimo](https://tiimoapp.com/) - iPhone App of the Year 2025
- Built with love for the neurodivergent community
- Icons by [Lucide](https://lucide.dev/)

---

Made with 💜 for brains that work differently
