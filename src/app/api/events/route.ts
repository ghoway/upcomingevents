import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// GET /api/events - List events with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (date) where.date = date;
    if (departmentId) {
      where.employee = { departmentId, deletedAt: null };
    }
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          room: true,
          employee: {
            include: { department: true },
          },
          user: { select: { id: true, username: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({ data: events, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Propose a new event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, roomId, employeeId, date, startTime, endTime } = await request.json();

    if (!title?.trim() || !roomId || !employeeId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine auto-approval logic
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { department: true },
    });

    if (!room || room.deletedAt) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee || employee.deletedAt) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    let status = 'PENDING';

    // Auto-approval logic:
    // 1. Main room (Ruang Rapat Utama) always requires admin approval → PENDING
    // 2. Department room + employee from same department → AUTO-APPROVED
    // 3. Admin users → AUTO-APPROVED
    if (room.isMainRoom) {
      status = 'PENDING';
    } else if (room.departmentId && room.departmentId === employee.departmentId) {
      status = 'APPROVED';
    } else if ((session.user as any).role === 'ADMIN') {
      status = 'APPROVED';
    }

    // Check for time conflicts in the same room (only against approved events)
    const conflicting = await prisma.event.findFirst({
      where: {
        roomId,
        date,
        deletedAt: null,
        status: 'APPROVED',
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflicting && status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Time conflict with an existing approved event in this room' },
        { status: 409 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        roomId,
        employeeId,
        userId: (session.user as any).id,
        date,
        startTime,
        endTime,
        status,
      },
      include: {
        room: true,
        employee: { include: { department: true } },
      },
    });

    broadcast('event-updated', { eventId: event.id });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
