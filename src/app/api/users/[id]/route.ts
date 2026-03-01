import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';
import bcryptjs from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { username, password, role, employeeId } = await request.json();

    const data: any = {};
    if (username) data.username = username.trim();
    if (password) data.password = await bcryptjs.hash(password, 10);
    if (role) data.role = role;
    if (employeeId !== undefined) data.employeeId = employeeId || null;

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    broadcast('user-updated');
    return NextResponse.json({ id: user.id, username: user.username, role: user.role });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    broadcast('user-updated');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
