import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';
import bcryptjs from 'bcryptjs';

// GET /api/users - List all users
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        username: true,
        role: true,
        employeeId: true,
        createdAt: true,
        employee: {
          select: { name: true, department: { select: { name: true, id: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { username, password, role, employeeId } = await request.json();
    if (!username?.trim() || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        role: role || 'USER',
        employeeId: employeeId || null,
      },
    });

    broadcast('user-updated');
    return NextResponse.json({ id: user.id, username: user.username, role: user.role }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
