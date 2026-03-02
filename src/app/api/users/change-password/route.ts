import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcryptjs from 'bcryptjs';

// POST /api/users/change-password
// Self: { currentPassword, newPassword }
// Admin reset: { userId, newPassword }
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const currentUser = session.user as any;
    const isAdmin = currentUser.role === 'ADMIN';

    // Admin resetting another user's password
    if (body.userId && isAdmin) {
      if (!body.newPassword || body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: body.userId } });
      if (!user || user.deletedAt) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }

      const hashedPassword = await bcryptjs.hash(body.newPassword, 10);
      await prisma.user.update({
        where: { id: body.userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true, message: 'Password berhasil direset' });
    }

    // Self change password
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru harus diisi' }, { status: 400 });
    }

    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const isValid = await bcryptjs.compare(body.currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 });
    }

    const hashedPassword = await bcryptjs.hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}
