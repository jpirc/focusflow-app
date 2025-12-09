# FocusFlow Production Architecture

## Overview

This document outlines the complete architecture for transforming FocusFlow from a frontend prototype into a full production application with user accounts, cloud sync, and AI-powered features.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js 14 App                        │   │
│  │  • React Server Components                               │   │
│  │  • Client-side interactivity                            │   │
│  │  • TailwindCSS styling                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Next.js API Routes                       │   │
│  │  • /api/auth/* - Authentication                         │   │
│  │  • /api/tasks/* - Task CRUD                             │   │
│  │  • /api/projects/* - Project management                 │   │
│  │  • /api/ai/* - AI task breakdown                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICES                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Supabase   │  │    Redis     │  │   Claude     │          │
│  │  (Postgres)  │  │   (Cache)    │  │     API      │          │
│  │              │  │              │  │              │          │
│  │ • User data  │  │ • Sessions   │  │ • Task       │          │
│  │ • Tasks      │  │ • Rate limit │  │   breakdown  │          │
│  │ • Projects   │  │ • Real-time  │  │ • Smart      │          │
│  │ • Auth       │  │              │  │   scheduling │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (PostgreSQL via Supabase)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL if using OAuth
  display_name VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Preferences JSONB structure:
-- {
--   "theme": "light" | "dark" | "auto",
--   "defaultTimeBlock": "morning" | "afternoon" | "evening" | "anytime",
--   "weekStartsOn": 0-6,
--   "notificationsEnabled": boolean,
--   "soundEnabled": boolean,
--   "reducedMotion": boolean
-- }
```

### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL, -- Hex color
  icon VARCHAR(50) DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- For subtasks
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'target',
  
  -- Scheduling
  scheduled_date DATE, -- NULL = inbox/unscheduled
  time_block VARCHAR(20) CHECK (time_block IN ('anytime', 'morning', 'afternoon', 'evening')),
  
  -- Time tracking
  estimated_minutes INTEGER DEFAULT 30,
  actual_minutes INTEGER,
  
  -- Status & priority
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in-progress', 'completed', 'skipped', 'carried-over')),
  priority VARCHAR(10) DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  energy_level VARCHAR(10) DEFAULT 'medium'
    CHECK (energy_level IN ('low', 'medium', 'high')),
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB, -- iCal RRULE format
  
  -- Metadata
  notes TEXT,
  tags TEXT[], -- Array of tag strings
  ai_generated BOOLEAN DEFAULT FALSE,
  carried_over_from DATE,
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_date ON tasks(user_id, scheduled_date);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
```

### Task Dependencies Table
```sql
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(task_id, depends_on_task_id)
);

CREATE INDEX idx_deps_task ON task_dependencies(task_id);
CREATE INDEX idx_deps_depends ON task_dependencies(depends_on_task_id);
```

### Sessions Table (for auth)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register     - Create new account
POST   /api/auth/login        - Email/password login
POST   /api/auth/logout       - End session
GET    /api/auth/session      - Get current session
POST   /api/auth/refresh      - Refresh access token
POST   /api/auth/forgot       - Request password reset
POST   /api/auth/reset        - Reset password with token

GET    /api/auth/google       - Initiate Google OAuth
GET    /api/auth/google/callback
GET    /api/auth/apple        - Initiate Apple OAuth
GET    /api/auth/apple/callback
```

### Tasks
```
GET    /api/tasks             - List tasks (with filters)
       ?date=2024-01-15       - Filter by date
       ?project=uuid          - Filter by project
       ?status=pending        - Filter by status
       ?inbox=true            - Only unscheduled

POST   /api/tasks             - Create task
GET    /api/tasks/:id         - Get task details
PUT    /api/tasks/:id         - Update task
DELETE /api/tasks/:id         - Delete task

PUT    /api/tasks/:id/status  - Quick status update
PUT    /api/tasks/:id/schedule - Move to date/time block
POST   /api/tasks/:id/duplicate - Clone task
```

### Projects
```
GET    /api/projects          - List user's projects
POST   /api/projects          - Create project
PUT    /api/projects/:id      - Update project
DELETE /api/projects/:id      - Delete (or archive)
PUT    /api/projects/reorder  - Update sort order
```

### AI Features
```
POST   /api/ai/breakdown      - Get AI task breakdown
       Body: { taskId, title, description?, estimatedMinutes }
       Returns: { subtasks: [...], tips: [...] }

POST   /api/ai/estimate       - Get time estimate
       Body: { title, description? }
       Returns: { estimatedMinutes, confidence }

POST   /api/ai/unstuck        - Get help when stuck
       Body: { taskId }
       Returns: { suggestions: [...] }
```

### User
```
GET    /api/user/profile      - Get user profile
PUT    /api/user/profile      - Update profile
PUT    /api/user/preferences  - Update preferences
DELETE /api/user/account      - Delete account
GET    /api/user/export       - Export all data (GDPR)
```

---

## AI Task Breakdown Implementation

### Using Claude API

```typescript
// lib/ai/breakdown.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function breakdownTask(task: {
  title: string;
  description?: string;
  estimatedMinutes: number;
}): Promise<{
  subtasks: Array<{ title: string; estimatedMinutes: number }>;
  tips: string[];
  totalEstimate: number;
}> {
  const prompt = `You are helping someone with ADHD break down a task into smaller, manageable steps.

Task: "${task.title}"
${task.description ? `Description: ${task.description}` : ''}
Estimated time: ${task.estimatedMinutes} minutes

Please provide:
1. A breakdown of 3-7 specific, actionable subtasks
2. Time estimate for each subtask (should roughly add up to the total)
3. 2-3 tips for getting started and maintaining momentum

Respond in JSON format:
{
  "subtasks": [
    { "title": "Step description", "estimatedMinutes": 15 }
  ],
  "tips": ["Tip 1", "Tip 2"],
  "totalEstimate": 60
}

Focus on:
- Making the first step especially easy to start
- Breaking down any step that feels overwhelming
- Keeping steps specific and actionable (not vague)
- Acknowledging that perfection isn't the goal`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' 
    ? message.content[0].text 
    : '';
  
  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }
  
  return JSON.parse(jsonMatch[0]);
}
```

### API Route

```typescript
// app/api/ai/breakdown/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { breakdownTask } from '@/lib/ai/breakdown';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting (10 requests per hour)
  const rateLimitResult = await rateLimit(session.userId, 'ai-breakdown', 10, 3600);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = await breakdownTask(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI breakdown error:', error);
    return NextResponse.json(
      { error: 'Failed to generate breakdown' },
      { status: 500 }
    );
  }
}
```

---

## Authentication Implementation

### Using NextAuth.js (Auth.js)

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Deployment Configuration

### Vercel Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/focusflow

# Auth
NEXTAUTH_URL=https://focusflow.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Redis (optional, for rate limiting)
REDIS_URL=redis://xxx

# Monitoring (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Vercel Project Settings

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

---

## Security Checklist

- [ ] HTTPS everywhere (Vercel handles this)
- [ ] Secure session cookies (HttpOnly, Secure, SameSite=Lax)
- [ ] CSRF protection via NextAuth
- [ ] Rate limiting on auth and AI endpoints
- [ ] Input validation with Zod schemas
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React auto-escaping + CSP headers)
- [ ] Password hashing with bcrypt (cost factor 12)
- [ ] JWT token expiration (15 min access, 7 day refresh)
- [ ] Audit logging for sensitive operations
- [ ] GDPR compliance (data export, account deletion)

---

## Next Steps

1. **Set up Supabase** - Create project, run migrations
2. **Add NextAuth** - Configure providers and callbacks  
3. **Create API routes** - Task CRUD, project management
4. **Add real AI** - Replace mock with Claude API
5. **Deploy to Vercel** - Set environment variables
6. **Set up monitoring** - Sentry for errors, Vercel Analytics

---

## Estimated Timeline

| Phase | Duration | Scope |
|-------|----------|-------|
| Auth & Database | 1 week | User accounts, Supabase setup |
| API Routes | 1 week | Full CRUD operations |
| AI Integration | 3-4 days | Claude API, rate limiting |
| Testing & Polish | 1 week | Bug fixes, edge cases |
| **Total** | **3-4 weeks** | Production-ready MVP |
