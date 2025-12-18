import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get today's date info for the AI prompt
function getDateContext(): string {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `Today is ${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}. The current time is ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const dateContext = getDateContext();

    // Use OpenAI to parse the text into structured tasks
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a task parsing assistant for an ADHD-friendly task management app. 
Your job is to take freeform notes, ideas, or thoughts and convert them into structured, actionable tasks.

${dateContext}

Rules:
1. Break down complex thoughts into individual, concrete tasks
2. Make tasks specific and actionable (start with a verb)
3. Extract time estimates when mentioned (convert to minutes)
4. Infer priority based on language cues (urgent, ASAP, important = high/urgent; later, sometime = low)
5. Infer energy level based on task complexity (simple = low, moderate = medium, complex = high)
6. If it's just one task, return it as one task
7. If it's multiple tasks or a complex project, break it down
8. Use appropriate icons: coffee (personal), briefcase (work), home (household), heart (health), dumbbell (fitness), book (learning), target (goals)

DATE AND TIME EXTRACTION (IMPORTANT):
- Extract dates when mentioned: "tomorrow", "Friday", "next week", "Dec 20", etc.
- Return dates in YYYY-MM-DD format (e.g., "2025-12-20")
- Extract time blocks based on time mentioned:
  - Morning times (6am-12pm) → timeBlock: "morning"
  - Afternoon times (12pm-5pm) → timeBlock: "afternoon"  
  - Evening times (5pm-10pm) → timeBlock: "evening"
  - No specific time or "anytime" → timeBlock: "anytime"
- If no date is mentioned, set date to null (task goes to inbox)
- "today at 2pm" → date: today's date, timeBlock: "afternoon"
- "Friday morning" → date: that Friday, timeBlock: "morning"
- "next week" → date: next Monday, timeBlock: "anytime"

Return a JSON array of tasks with this structure:
{
  "tasks": [
    {
      "title": "Do the thing",
      "description": "Optional detailed description",
      "date": "2025-12-20" or null,
      "timeBlock": "morning" | "afternoon" | "evening" | "anytime" | null,
      "estimatedMinutes": 30,
      "priority": "medium",
      "energyLevel": "medium",
      "icon": "target"
    }
  ]
}

Priority options: low, medium, high, urgent
Energy options: low, medium, high
TimeBlock options: morning, afternoon, evening, anytime (or null if no date)
Icon options: coffee, briefcase, home, heart, dumbbell, book, target`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{"tasks":[]}');
    
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error parsing tasks:', error);
    return NextResponse.json(
      { error: 'Failed to parse tasks', details: error.message },
      { status: 500 }
    );
  }
}
