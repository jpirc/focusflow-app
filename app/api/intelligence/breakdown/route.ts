/**
 * AI Task Breakdown API
 * 
 * Uses OpenAI to intelligently break down tasks into subtasks
 * Context-aware: considers energy level, time estimates, user patterns
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getAuthSession, unauthorizedResponse, successResponse, errorResponse, validateRequest } from '@/lib/api/route_utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const BreakdownRequestSchema = z.object({
    taskId: z.string(),
    taskTitle: z.string(),
    taskDescription: z.string().optional(),
    estimatedMinutes: z.number().default(30),
    energyLevel: z.enum(['low', 'medium', 'high']).default('medium'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    projectId: z.string().optional(),
    timeBlock: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
    userContext: z.string().optional(), // User's instructions/context about why they're stuck
});

export async function POST(req: NextRequest) {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorizedResponse();

    const { data, error } = await validateRequest(req, BreakdownRequestSchema);
    if (error || !data) {
        return errorResponse('Invalid request data', 400);
    }

    try {
        // Gather context about user's patterns and the project
        const [completedTasks, projectInfo, userInsights] = await Promise.all([
            // Recent completed tasks for context
            prisma.task.findMany({
                where: {
                    userId: session.user.id,
                    status: 'completed',
                    projectId: data.projectId,
                },
                select: {
                    title: true,
                    estimatedMinutes: true,
                    actualMinutes: true,
                },
                orderBy: { completedAt: 'desc' },
                take: 5,
            }),
            // Project context if available
            data.projectId ? prisma.project.findUnique({
                where: { id: data.projectId },
                select: { name: true, description: true },
            }) : null,
            // User insights for personalization
            prisma.userInsight.findMany({
                where: {
                    userId: session.user.id,
                    isActive: true,
                },
                select: {
                    insightType: true,
                    pattern: true,
                    confidence: true,
                },
                take: 5,
            }),
        ]);

        // Build context-aware prompt
        const systemPrompt = buildSystemPrompt(data.energyLevel, userInsights);
        const userPrompt = buildUserPrompt(data, projectInfo, completedTasks);

        // Save user context if provided (for learning)
        if (data.userContext && data.userContext.trim().length > 0) {
            await prisma.taskEvent.create({
                data: {
                    userId: session.user.id,
                    taskId: data.taskId,
                    eventType: 'breakdown_context',
                    metadata: {
                        userContext: data.userContext,
                        energyLevel: data.energyLevel,
                        priority: data.priority,
                    },
                },
            });
        }

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000,
        });

        const responseText = completion.choices[0].message.content;
        if (!responseText) {
            throw new Error('No response from AI');
        }

        const breakdown = JSON.parse(responseText);

        // Validate the response structure
        if (!breakdown.subtasks || !Array.isArray(breakdown.subtasks)) {
            throw new Error('Invalid AI response format');
        }

        // Save the suggestion for learning
        await prisma.suggestion.create({
            data: {
                userId: session.user.id,
                taskId: data.taskId,
                type: 'breakdown',
                title: 'AI Task Breakdown',
                description: `Break down "${data.taskTitle}" into ${breakdown.subtasks.length} subtasks`,
                action: {
                    type: 'breakdown',
                    subtasks: breakdown.subtasks,
                },
                reasoning: breakdown.reasoning || 'AI-generated task breakdown',
                confidence: 0.8,
                source: 'ai',
                status: 'pending',
            },
        });

        return successResponse({
            subtasks: breakdown.subtasks,
            totalEstimate: breakdown.totalEstimate || data.estimatedMinutes,
            tips: breakdown.tips || [],
            reasoning: breakdown.reasoning,
        });
    } catch (error: any) {
        console.error('AI Breakdown Error:', error);
        
        // Fallback to rule-based breakdown if AI fails
        const fallbackBreakdown = generateFallbackBreakdown(data);
        return successResponse({
            ...fallbackBreakdown,
            fallback: true,
            error: 'AI temporarily unavailable, using smart fallback',
        });
    }
}

/**
 * Build system prompt based on user's energy level and patterns
 */
function buildSystemPrompt(energyLevel: string, insights: any[]): string {
    let basePrompt = `You're a friendly ADHD coach helping someone break down a task. Use casual, encouraging language - you're talking TO them, not about them.

ADHD-Friendly Breakdown Principles:
- **FIRST STEP IS KEY**: Make it RIDICULOUSLY easy and specific - the entire goal is beating initiation paralysis (like "Open laptop and pull up Gmail" or "Grab notebook from desk and sit at table")
- This first step should feel like a 1-minute no-brainer they can't say no to
- **AFTER FIRST STEP**: Once momentum builds, they don't need micromanagement - give them 10-15 minute chunks they can sink their teeth into
- Keep it to 4-6 total steps MAX - don't over-break-it-down
- Use simple, direct language like "Grab your laptop" not "Retrieve computing device"
- Be specific about WHERE and WHAT (not "gather materials" - say "grab your notebook from the desk")

Current vibe:
- Energy level: ${energyLevel}`;

    // Adjust based on energy level
    if (energyLevel === 'low') {
        basePrompt += `
- LOW energy mode: First step EXTRA tiny (like "Just open the file")
- Steps 2-4 can be 8-10 minutes each
- Keep total steps under 5`;
    } else if (energyLevel === 'high') {
        basePrompt += `
- HIGH energy mode: First step still easy to START
- Then give chunky 15-20 min steps they can power through
- Front-load the hard stuff in steps 2-3 while energy lasts`;
    } else {
        basePrompt += `
- MEDIUM energy: Tiny first step, then 10-15 min chunks
- Balance easy and harder steps
- Keep total around 4-5 steps`;
    }

    // Add learned patterns
    if (insights.length > 0) {
        basePrompt += `\n\nWhat I know about you:`;
        insights.forEach(insight => {
            if (insight.insightType === 'time_preference') {
                basePrompt += `\n- You tend to crush it during ${JSON.stringify(insight.pattern)}`;
            }
        });
    }

    basePrompt += `\n\nGive me back a JSON object like this:
{
  "subtasks": [
    { "title": "Super specific action step", "estimatedMinutes": 3 }
  ],
  "totalEstimate": 15,
  "tips": ["ADHD-friendly encouragement or hack"],
  "reasoning": "Why you broke it down this way"
}

Remember: Talk like a human friend, not a productivity robot. Use "you" and "your" - be encouraging!`;

    return basePrompt;
}

/**
 * Build user prompt with task details
 */
function buildUserPrompt(
    data: z.infer<typeof BreakdownRequestSchema>,
    projectInfo: any,
    completedTasks: any[]
): string {
    let prompt = `Please break down this task:\n\nTitle: "${data.taskTitle}"`;

    if (data.taskDescription) {
        prompt += `\nDescription: ${data.taskDescription}`;
    }

    prompt += `\nEstimated time: ${data.estimatedMinutes} minutes`;
    prompt += `\nPriority: ${data.priority}`;

    if (data.timeBlock) {
        prompt += `\nScheduled for: ${data.timeBlock}`;
    }

    if (projectInfo) {
        prompt += `\n\nProject context: ${projectInfo.name}`;
        if (projectInfo.description) {
            prompt += ` - ${projectInfo.description}`;
        }
    }

    // Include user's context/instructions if provided
    if (data.userContext && data.userContext.trim().length > 0) {
        prompt += `\n\n**User's situation/challenge:**\n${data.userContext}`;
        prompt += `\n(Pay special attention to this context when breaking down the task)`;
    }

    if (completedTasks.length > 0) {
        prompt += `\n\nRecent similar tasks completed by user:`;
        completedTasks.forEach(task => {
            prompt += `\n- "${task.title}" (estimated: ${task.estimatedMinutes}min, actual: ${task.actualMinutes || 'N/A'}min)`;
        });
    }

    prompt += `\n\nBreak this down into achievable subtasks with realistic time estimates.`;

    return prompt;
}

/**
 * Fallback rule-based breakdown if AI fails
 */
function generateFallbackBreakdown(data: z.infer<typeof BreakdownRequestSchema>) {
    const keywords = data.taskTitle.toLowerCase();
    
    // Email/writing tasks
    if (keywords.includes('email') || keywords.includes('write')) {
        return {
            subtasks: [
                { title: 'Identify key message and recipient needs', estimatedMinutes: 5 },
                { title: 'Draft main points in bullets', estimatedMinutes: 10 },
                { title: 'Expand into full text', estimatedMinutes: Math.floor(data.estimatedMinutes * 0.5) },
                { title: 'Proofread and send', estimatedMinutes: 5 },
            ],
            totalEstimate: data.estimatedMinutes,
            tips: [
                'Start with bullet points, then expand',
                'Keep paragraphs short (2-3 sentences)',
                'Read aloud before sending',
            ],
        };
    }
    
    // Meeting/presentation tasks
    if (keywords.includes('meeting') || keywords.includes('present')) {
        return {
            subtasks: [
                { title: 'Review agenda and objectives', estimatedMinutes: 5 },
                { title: 'Prepare key talking points', estimatedMinutes: Math.floor(data.estimatedMinutes * 0.3) },
                { title: 'Anticipate questions', estimatedMinutes: 10 },
                { title: 'Quick practice run', estimatedMinutes: 10 },
            ],
            totalEstimate: data.estimatedMinutes,
            tips: [
                'Arrive 5 minutes early',
                'Have materials ready beforehand',
                'It\'s okay to say "I\'ll follow up on that"',
            ],
        };
    }
    
    // Default breakdown
    const perStep = Math.floor(data.estimatedMinutes / 4);
    return {
        subtasks: [
            { title: 'Gather materials and context', estimatedMinutes: perStep },
            { title: 'Start with easiest part', estimatedMinutes: perStep },
            { title: 'Work through main task', estimatedMinutes: perStep },
            { title: 'Review and wrap up', estimatedMinutes: perStep },
        ],
        totalEstimate: data.estimatedMinutes,
        tips: [
            'Start with the easiest part to build momentum',
            'Take breaks between subtasks if needed',
            'Check off each subtask for dopamine boost',
        ],
    };
}
