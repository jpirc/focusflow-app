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
    
    // Extract specific time (e.g., "at 12:30", "at 2pm", "9:15am")
    let scheduledHour: number | null = null;
    let scheduledMinute: number | null = null;

    // Pattern: "at 12:30pm", "at 2:30", "12:30pm", etc.
    const timeMatch = trimmed.match(/(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      let minute = parseInt(timeMatch[2]);
      const meridiem = timeMatch[3]?.toLowerCase();

      // Convert to 24-hour format
      if (meridiem === 'pm' && hour !== 12) {
        hour += 12;
      } else if (meridiem === 'am' && hour === 12) {
        hour = 0;
      }

      // Round minute to nearest 15
      minute = Math.round(minute / 15) * 15;
      if (minute === 60) {
        minute = 0;
        hour += 1;
      }

      scheduledHour = hour;
      scheduledMinute = minute;

      // Set timeBlock based on hour if not already set
      if (scheduledHour >= 6 && scheduledHour < 12) {
        timeBlock = 'morning';
      } else if (scheduledHour >= 12 && scheduledHour < 17) {
        timeBlock = 'afternoon';
      } else if (scheduledHour >= 17 && scheduledHour < 22) {
        timeBlock = 'evening';
      }
    } else {
      // Pattern: "at 2pm", "9am", etc. (no minutes)
      const simpleTimeMatch = trimmed.match(/(?:at\s+)?(\d{1,2})\s*(am|pm)/i);
      if (simpleTimeMatch) {
        let hour = parseInt(simpleTimeMatch[1]);
        const meridiem = simpleTimeMatch[2].toLowerCase();

        if (meridiem === 'pm' && hour !== 12) {
          hour += 12;
        } else if (meridiem === 'am' && hour === 12) {
          hour = 0;
        }

        scheduledHour = hour;
        scheduledMinute = 0;

        // Set timeBlock based on hour
        if (scheduledHour >= 6 && scheduledHour < 12) {
          timeBlock = 'morning';
        } else if (scheduledHour >= 12 && scheduledHour < 17) {
          timeBlock = 'afternoon';
        } else if (scheduledHour >= 17 && scheduledHour < 22) {
          timeBlock = 'evening';
        }
      }
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
      // Remove specific times (e.g., "at 12:30pm", "at 2pm")
      .replace(/(?:at\s+)?\d{1,2}:\d{2}\s*(?:am|pm)?/gi, '')
      .replace(/(?:at\s+)?\d{1,2}\s*(?:am|pm)/gi, '')
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
      scheduledHour,
      scheduledMinute,
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
          content: `You are an intelligent task extraction assistant for an ADHD-friendly task management app.
Your job is to take ANY text input and convert it into structured, actionable tasks.

${dateContext}

🔑 CRITICAL RULE - PERSPECTIVE:
When extracting tasks from emails, texts, or messages, ALWAYS extract from the RECIPIENT's perspective (what the USER needs to do).
- Extract: "Can you send...", "Would you mind...", "Don't forget to..." → These are actions the recipient must do
- Ignore: What the sender is doing, background context, or FYI information
- If someone asks "Can you review the report?", the task is "Review the report" (for the recipient), NOT "Ask someone to review"

TWO MODES OF OPERATION:

MODE 1 - SIMPLE/EXPLICIT TASKS (most common):
When the user types explicit tasks like "call mom tomorrow morning" or "buy groceries":
- PRESERVE THE FULL TASK DESCRIPTION - keep all the details they provided
- Only remove scheduling keywords (today, tomorrow, this evening, etc.) from the title
- Keep ALL context (e.g., "to talk about the dog", "about the meeting")
- This is for quick task entry

MODE 2 - CONVERSATIONAL/EMAIL TEXT (when detected):
When the input looks like an email, text message, meeting notes, or conversation:
- CRITICAL: Extract tasks from the RECIPIENT'S perspective (what the USER needs to do, not what the sender is doing)
- Look for REQUESTS directed at the user: "Can you...", "Would you mind...", "If you have time...", "Don't forget to..."
- Ignore what the sender is doing in the background - only extract actions requested OF the user
- Create ACTIONABLE titles starting with verbs (e.g., "Send response about...", "Review and reply...")
- Keep essential context but REMOVE fluff (greetings, signatures, background info the sender is providing)
- Look for multiple tasks in lists, paragraphs, or embedded in prose
- If unclear who needs to do the action, assume it's the recipient (the user)

DETECTION: If the text contains phrases like "Hi", "Hey", "Thanks", question marks, multiple sentences, or conversational tone → Use MODE 2. Otherwise → Use MODE 1.

CORE RULES (BOTH MODES):
1. Make tasks specific and actionable (start with a verb when possible)
2. Extract time estimates when mentioned (convert to minutes)
3. Infer priority based on language cues (urgent, ASAP, important, "today" = high; later, sometime = low)
4. Infer energy level based on task complexity (quick/simple = low, moderate = medium, complex = high)
5. Use appropriate icons: coffee (personal), briefcase (work), home (household), heart (health), dumbbell (fitness), book (learning), target (goals)

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

SPECIFIC TIME EXTRACTION (CRITICAL):
- If a specific time is mentioned (e.g., "at 12:30", "at 2pm", "9:15am"), extract it:
  - Set scheduledHour (0-23 in 24-hour format)
  - Set scheduledMinute (0, 15, 30, or 45 - round to nearest 15 min)
  - Still set the appropriate timeBlock based on the hour
- Examples:
  - "client call at 12:30 this afternoon" → scheduledHour: 12, scheduledMinute: 30, timeBlock: "afternoon"
  - "meeting at 9am tomorrow" → scheduledHour: 9, scheduledMinute: 0, timeBlock: "morning"
  - "dinner at 6:30pm" → scheduledHour: 18, scheduledMinute: 30, timeBlock: "evening"
  - "call at 2pm" → scheduledHour: 14, scheduledMinute: 0, timeBlock: "afternoon"

Return dates in YYYY-MM-DD format (e.g., "2026-01-08")

EXAMPLES - MODE 1 (SIMPLE/EXPLICIT TASKS):
Input: "call dad this evening to talk about the dog"
Output: {"tasks": [{"title": "call dad to talk about the dog", "date": "2026-02-09", "timeBlock": "evening", "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 30, "priority": "medium", "energyLevel": "low", "icon": "coffee"}]}

Input: "client call at 12:30 this afternoon"
Output: {"tasks": [{"title": "client call", "date": "2026-02-09", "timeBlock": "afternoon", "scheduledHour": 12, "scheduledMinute": 30, "estimatedMinutes": 30, "priority": "medium", "energyLevel": "low", "icon": "briefcase"}]}

Input: "finish report tomorrow afternoon - urgent 2 hours"
Output: {"tasks": [{"title": "finish report", "date": "2026-02-10", "timeBlock": "afternoon", "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 120, "priority": "urgent", "energyLevel": "high", "icon": "briefcase"}]}

Input: "buy groceries"
Output: {"tasks": [{"title": "buy groceries", "date": null, "timeBlock": null, "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 30, "priority": "medium", "energyLevel": "low", "icon": "home"}]}

EXAMPLES - MODE 2 (CONVERSATIONAL/EMAIL TEXT):
Input: "Hey y'all! I'm preparing a newsletter. If you have just a few minutes today, can you text me or email me YOUR personal response to 'Why I joined the PTO Board?'. I'd like to include your name and current position."
Output: {"tasks": [{"title": "Send response to 'Why I joined PTO board' question", "description": "Text or email personal response - they'll include name and position in newsletter", "date": "2026-02-09", "timeBlock": "anytime", "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 15, "priority": "medium", "energyLevel": "low", "icon": "coffee"}]}
NOTE: User is the RECIPIENT - they need to SEND their response, not prepare the newsletter

Input: "Quick reminder - the client presentation is tomorrow at 2pm. Can you review the slides before then and send me any feedback? Also, don't forget to update the budget numbers on slide 12."
Output: {"tasks": [{"title": "Review client presentation slides and send feedback", "description": "Before tomorrow's 2pm presentation", "date": "2026-02-09", "timeBlock": "morning", "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 30, "priority": "high", "energyLevel": "medium", "icon": "briefcase"}, {"title": "Update budget numbers on slide 12", "date": "2026-02-09", "timeBlock": "morning", "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 10, "priority": "high", "energyLevel": "low", "icon": "briefcase"}]}
NOTE: Extract "Can you review" and "don't forget to update" - actions requested OF the recipient. Ignore "presentation is tomorrow" - that's just context.

Input: "Hi team! I'm organizing the holiday party next week. Can you let me know your dietary restrictions by Wednesday? Also, if anyone wants to help with decorations, that would be great!"
Output: {"tasks": [{"title": "Send dietary restrictions for holiday party", "description": "Respond by Wednesday", "date": "2026-02-12", "timeBlock": "anytime", "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 5, "priority": "medium", "energyLevel": "low", "icon": "coffee"}]}
NOTE: User needs to SEND their restrictions. "Help with decorations" is optional ("if anyone wants") so don't extract unless they want to volunteer.

Input: "Meeting notes: - John mentioned API ready for testing - Need to schedule demo next week - Sarah needs help with docs - Deploy to staging by EOD"
Output: {"tasks": [{"title": "Test the API", "description": "John mentioned it's ready", "date": null, "timeBlock": null, "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 60, "priority": "medium", "energyLevel": "medium", "icon": "briefcase"}, {"title": "Schedule client demo", "description": "For next week", "date": null, "timeBlock": null, "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 15, "priority": "medium", "energyLevel": "low", "icon": "briefcase"}, {"title": "Help Sarah with documentation", "date": null, "timeBlock": null, "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 30, "priority": "low", "energyLevel": "medium", "icon": "briefcase"}, {"title": "Deploy to staging", "date": "2026-02-09", "timeBlock": "evening", "scheduledHour": null, "scheduledMinute": null, "estimatedMinutes": 30, "priority": "high", "energyLevel": "medium", "icon": "briefcase"}]}

IMPORTANT: If text contains NO actionable tasks (just greetings or pure info), return empty: {"tasks": []}

Return a JSON object with this structure:
{
  "tasks": [
    {
      "title": "Do the thing with all the details preserved",
      "description": "Optional detailed description",
      "date": "2026-01-08" or null,
      "timeBlock": "morning" | "afternoon" | "evening" | "anytime" | null,
      "scheduledHour": 0-23 or null (null if no specific time mentioned),
      "scheduledMinute": 0 | 15 | 30 | 45 or null (round to nearest 15 min, null if no specific time),
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
