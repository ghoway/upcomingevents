import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { broadcast } from '@/lib/websocket';

// GET /api/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    const where: any = { deletedAt: null };
    if (departmentId) where.departmentId = departmentId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        user: { select: { id: true, username: true, role: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST /api/employees - Create an employee
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, nip, departmentId } = await request.json();
    if (!name?.trim() || !departmentId) {
      return NextResponse.json({ error: 'Name and department are required' }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        nip: nip?.trim() || null,
        departmentId,
      },
      include: { department: true },
    });

    broadcast('employee-updated');
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
