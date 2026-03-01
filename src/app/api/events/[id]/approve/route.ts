import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// POST /api/events/[id]/approve - Approve event
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'PENDING') {
      return NextResponse.json({ error: 'Event is not pending approval' }, { status: 400 });
    }

    // Check for time conflicts
    const conflicting = await prisma.event.findFirst({
      where: {
        roomId: event.roomId,
        date: event.date,
        deletedAt: null,
        status: 'APPROVED',
        id: { not: event.id },
        OR: [
          {
            AND: [
              { startTime: { lte: event.startTime } },
              { endTime: { gt: event.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: event.endTime } },
              { endTime: { gte: event.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: event.startTime } },
              { endTime: { lte: event.endTime } },
            ],
          },
        ],
      },
    });

    if (conflicting) {
      return NextResponse.json(
        { error: 'Time conflict with an existing approved event' },
        { status: 409 }
      );
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        room: true,
        employee: { include: { department: true } },
      },
    });

    broadcast('event-updated', { eventId: id, action: 'approved' });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve event' }, { status: 500 });
  }
}
