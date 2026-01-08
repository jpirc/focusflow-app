import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Get today's date info for the AI prompt
function getDateContext(): string {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `Today is ${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}. The current time is ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.`;
}

// Fallback parser when OpenAI isn't available
function parseTasksFallback(text: string): any {
  const lines = text.split('\n').filter(line => line.trim());
  
  const tasks = lines.map(line => {
    const trimmed = line.trim();
    
    // Extract priority (check for keywords)
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (/urgent|asap|critical|!!!/i.test(trimmed)) {
      priority = 'urgent';
    } else if (/high priority|high|important|!!/i.test(trimmed)) {
      priority = 'high';
    } else if (/low priority|low|later|sometime/i.test(trimmed)) {
      priority = 'low';
    }
    
    // Extract energy level
    let energyLevel: 'low' | 'medium' | 'high' = 'medium';
    if (/quick|easy|simple|small/i.test(trimmed)) {
      energyLevel = 'low';
    } else if (/complex|difficult|challenging|big/i.test(trimmed)) {
      energyLevel = 'high';
    }
    
    // Extract time block
    let timeBlock: 'morning' | 'afternoon' | 'evening' | 'anytime' = 'anytime';
    let date: string | null = null;
    
    // Check for time-specific keywords first (must come before date extraction)
    const hasThisEvening = /this evening|tonight/i.test(trimmed);
    const hasThisAfternoon = /this afternoon/i.test(trimmed);
    const hasThisMorning = /this morning/i.test(trimmed);
    const hasTomorrowEvening = /tomorrow evening/i.test(trimmed);
    const hasTomorrowAfternoon = /tomorrow afternoon/i.test(trimmed);
    const hasTomorrowMorning = /tomorrow morning/i.test(trimmed);
    
    if (hasThisMorning || hasTomorrowMorning || /\b(in the )?morning\b/i.test(trimmed)) {
      timeBlock = 'morning';
    } else if (hasThisAfternoon || hasTomorrowAfternoon || /\b(in the )?afternoon\b|lunch|noon/i.test(trimmed)) {
      timeBlock = 'afternoon';
    } else if (hasThisEvening || hasTomorrowEvening || /\b(in the )?evening\b|dinner/i.test(trimmed)) {
      timeBlock = 'evening';
    }
    
    // Extract date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (/\btoday\b|this morning|this afternoon|this evening|tonight/i.test(trimmed)) {
      date = today.toISOString().split('T')[0];
    } else if (/\btomorrow\b/i.test(trimmed)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    } else if (/next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(trimmed)) {
      // Simple next week = next Monday
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7) + 7);
      date = nextWeek.toISOString().split('T')[0];
    }
    
    // Extract estimated time
    let estimatedMinutes = 30;
    const hourMatch = trimmed.match(/(\d+)\s*(?:hour|hr)s?/i);
    const minMatch = trimmed.match(/(\d+)\s*(?:minute|min)s?/i);
    if (hourMatch) {
      estimatedMinutes = parseInt(hourMatch[1]) * 60;
    } else if (minMatch) {
      estimatedMinutes = parseInt(minMatch[1]);
    }
    
    // Clean up title (remove ONLY date/time scheduling keywords, keep the actual task description)
    let title = trimmed
      // Remove priority keywords
      .replace(/\b(urgent|asap|high priority|low priority|important|critical)\b/gi, '')
      // Remove time/date scheduling phrases (be specific to avoid removing task content)
      .replace(/\b(this evening|this afternoon|this morning|tonight)\b/gi, '')
      .replace(/\b(tomorrow evening|tomorrow afternoon|tomorrow morning)\b/gi, '')
      .replace(/\btomorrow\b/gi, '')
      .replace(/\btoday\b/gi, '')
      .replace(/\bnext week\b/gi, '')
      // Remove time estimates
      .replace(/\d+\s*(?:hour|hr|minute|min)s?\b/gi, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove common list markers
    title = title.replace(/^[-•*#]\s*/, '').trim();
    
    // Infer icon based on keywords
    let icon = 'target';
    if (/email|call|meeting|work|project|client|boss/i.test(title)) icon = 'briefcase';
    if (/clean|house|home|laundry|organize/i.test(title)) icon = 'home';
    if (/gym|workout|exercise|run|walk/i.test(title)) icon = 'dumbbell';
    if (/read|learn|study|course|book/i.test(title)) icon = 'book';
    if (/health|doctor|medical|appointment|dentist/i.test(title)) icon = 'heart';
    if (/coffee|breakfast|lunch|dinner|eat/i.test(title)) icon = 'coffee';
    
    return {
      title: title || 'New Task',
      date,
      timeBlock: date ? timeBlock : 'anytime', // Always set timeBlock if we have a date
      estimatedMinutes,
      priority,
      energyLevel,
      icon,
    };
  });
  
  return { tasks };
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

    // Use fallback parser if OpenAI isn't configured
    if (!openai) {
      const parsed = parseTasksFallback(text);
      return NextResponse.json(parsed);
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

CRITICAL RULES:
1. PRESERVE THE FULL TASK DESCRIPTION - Do NOT shorten or summarize the user's input
2. Only remove scheduling keywords (today, tomorrow, this evening, etc.) from the title
3. Keep ALL context and details the user provided (e.g., "to talk about the dog", "about the meeting", etc.)
4. Make tasks specific and actionable (start with a verb when possible)
5. Extract time estimates when mentioned (convert to minutes)
6. Infer priority based on language cues (urgent, ASAP, important = high/urgent; later, sometime = low)
7. Infer energy level based on task complexity (quick/simple = low, moderate = medium, complex = high)
8. Use appropriate icons: coffee (personal), briefcase (work), home (household), heart (health), dumbbell (fitness), book (learning), target (goals)

DATE AND TIME EXTRACTION (VERY IMPORTANT):
- "this evening" or "tonight" → date: TODAY, timeBlock: "evening"
- "this afternoon" → date: TODAY, timeBlock: "afternoon"  
- "this morning" → date: TODAY, timeBlock: "morning"
- "tomorrow evening" → date: TOMORROW, timeBlock: "evening"
- "tomorrow afternoon" → date: TOMORROW, timeBlock: "afternoon"
- "tomorrow morning" → date: TOMORROW, timeBlock: "morning"
- "tomorrow" (no time) → date: TOMORROW, timeBlock: "anytime"
- "today" (no time) → date: TODAY, timeBlock: "anytime"
- "Friday", "next week", etc. → date: that date, timeBlock: "anytime"
- NO date/time mentioned → date: null, timeBlock: null (goes to inbox)

Return dates in YYYY-MM-DD format (e.g., "2026-01-08")

EXAMPLES:
Input: "call dad this evening to talk about the dog"
Output: {"tasks": [{"title": "call dad to talk about the dog", "date": "2026-01-08", "timeBlock": "evening", "estimatedMinutes": 30, "priority": "medium", "energyLevel": "low", "icon": "coffee"}]}

Input: "finish report tomorrow afternoon - urgent 2 hours"
Output: {"tasks": [{"title": "finish report", "date": "2026-01-09", "timeBlock": "afternoon", "estimatedMinutes": 120, "priority": "urgent", "energyLevel": "high", "icon": "briefcase"}]}

Input: "buy groceries"
Output: {"tasks": [{"title": "buy groceries", "date": null, "timeBlock": null, "estimatedMinutes": 30, "priority": "medium", "energyLevel": "low", "icon": "home"}]}

Return a JSON object with this structure:
{
  "tasks": [
    {
      "title": "Do the thing with all the details preserved",
      "description": "Optional detailed description",
      "date": "2026-01-08" or null,
      "timeBlock": "morning" | "afternoon" | "evening" | "anytime" | null,
      "estimatedMinutes": 30,
      "priority": "low" | "medium" | "high" | "urgent",
      "energyLevel": "low" | "medium" | "high",
      "icon": "coffee" | "briefcase" | "home" | "heart" | "dumbbell" | "book" | "target"
    }
  ]
}`,
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
