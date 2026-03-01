import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// PUT /api/departments/[id] - Update department
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { name } = await request.json();

    const department = await prisma.department.update({
      where: { id },
      data: { name: name.trim() },
    });

    broadcast('department-updated');
    return NextResponse.json(department);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

// DELETE /api/departments/[id] - Soft delete department
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    broadcast('department-updated');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
