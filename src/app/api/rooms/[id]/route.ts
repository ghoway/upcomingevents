import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { name, departmentId } = await request.json();

    const room = await prisma.room.update({
      where: { id },
      data: { name: name.trim(), departmentId: departmentId || null },
    });

    broadcast('room-updated');
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id } });
    if (room?.isMainRoom) {
      return NextResponse.json({ error: 'Cannot delete main meeting room' }, { status: 400 });
    }

    await prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    broadcast('room-updated');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
