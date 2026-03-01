import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// GET /api/departments - List all departments
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        rooms: { where: { deletedAt: null } },
        _count: { select: { employees: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST /api/departments - Create a department (auto-creates a room)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create department with auto-generated room
    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        rooms: {
          create: {
            name: `Ruang ${name.trim()}`,
          },
        },
      },
      include: {
        rooms: true,
      },
    });

    broadcast('department-updated');
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
