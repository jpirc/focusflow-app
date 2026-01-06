import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/timezone
 * Get user's timezone setting
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    });

    return NextResponse.json({ timezone: user?.timezone || 'America/Chicago' });
  } catch (error: any) {
    console.error('Get timezone error:', error);
    return NextResponse.json(
      { error: 'Failed to get timezone', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/timezone
 * Update user's timezone setting
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timezone } = await req.json();

    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { timezone },
      select: { timezone: true },
    });

    return NextResponse.json({ timezone: user.timezone });
  } catch (error: any) {
    console.error('Update timezone error:', error);
    return NextResponse.json(
      { error: 'Failed to update timezone', details: error.message },
      { status: 500 }
    );
  }
}
