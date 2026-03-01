import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// POST /api/events/[id]/reject - Reject event with optional remarks
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const remarks = body.remarks || null;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'PENDING') {
      return NextResponse.json({ error: 'Event is not pending' }, { status: 400 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: 'REJECTED', remarks },
      include: {
        room: true,
        employee: { include: { department: true } },
      },
    });

    broadcast('event-updated', { eventId: id, action: 'rejected' });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reject event' }, { status: 500 });
  }
}
