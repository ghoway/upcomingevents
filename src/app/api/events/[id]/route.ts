import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// PUT /api/events/[id] - Update event details
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only admin or event creator can edit
    const isAdmin = (session.user as any).role === 'ADMIN';
    const isOwner = event.userId === (session.user as any).id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data: any = {};
    if (body.title) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.date) data.date = body.date;
    if (body.startTime) data.startTime = body.startTime;
    if (body.endTime) data.endTime = body.endTime;

    const updated = await prisma.event.update({
      where: { id },
      data,
      include: {
        room: true,
        employee: { include: { department: true } },
      },
    });

    broadcast('event-updated', { eventId: id });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Soft delete event
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isAdmin = (session.user as any).role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    broadcast('event-updated', { eventId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
