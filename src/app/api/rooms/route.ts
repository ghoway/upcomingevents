import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// GET /api/rooms - List all rooms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where: { deletedAt: null },
        include: { department: true },
        orderBy: [{ isMainRoom: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.room.count({ where: { deletedAt: null } }),
    ]);
    return NextResponse.json({ data: rooms, total, page, limit });
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

    const { name, departmentId, isMainRoom } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        isMainRoom: isMainRoom || false,
        departmentId: isMainRoom ? null : (departmentId || null),
      },
      include: { department: true },
    });

    broadcast('room-updated');
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
