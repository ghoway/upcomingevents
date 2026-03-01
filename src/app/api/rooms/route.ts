import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// GET /api/rooms - List all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { deletedAt: null },
      include: { department: true },
      orderBy: [{ isMainRoom: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST /api/rooms - Create a room 
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, departmentId } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        departmentId: departmentId || null,
      },
      include: { department: true },
    });

    broadcast('room-updated');
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
