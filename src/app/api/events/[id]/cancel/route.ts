import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// POST /api/events/[id]/cancel - Cancel event with optional remarks
// Logic:
// - If event is PENDING → user can cancel directly
// - If event is APPROVED → only admin can cancel
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const remarks = body.remarks || null;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isAdmin = (session.user as any).role === 'ADMIN';
    const isOwner = event.userId === (session.user as any).id;

    if (event.status === 'CANCELLED' || event.status === 'REJECTED') {
      return NextResponse.json({ error: 'Event is already cancelled/rejected' }, { status: 400 });
    }

    if (event.status === 'APPROVED') {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Approved events can only be cancelled by an admin' },
          { status: 403 }
        );
      }
    } else if (event.status === 'PENDING') {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'You can only cancel your own events' }, { status: 403 });
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED', remarks },
      include: {
        room: true,
        employee: { include: { department: true } },
      },
    });

    broadcast('event-updated', { eventId: id, action: 'cancelled' });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel event' }, { status: 500 });
  }
}
