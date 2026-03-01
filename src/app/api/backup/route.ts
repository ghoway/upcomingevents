import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

// POST /api/backup - Trigger database backup and send via Telegram
export async function POST() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get Telegram settings
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['telegram_bot_token', 'telegram_chat_id'] } },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const botToken = settingsMap['telegram_bot_token'];
    const chatId = settingsMap['telegram_chat_id'];

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram Bot Token and Chat ID must be configured in Settings' },
        { status: 400 }
      );
    }

    // Read the SQLite database file
    const dbPath = join(process.cwd(), 'prisma', 'dev.db');
    const dbBuffer = readFileSync(dbPath);

    // Create form data for Telegram
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append(
      'document',
      new Blob([dbBuffer], { type: 'application/octet-stream' }),
      `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
    );
    formData.append('caption', `🗄️ Database Backup\n📅 ${new Date().toLocaleString('id-ID')}`);

    // Send to Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendDocument`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();

    if (!result.ok) {
      return NextResponse.json(
        { error: `Telegram API error: ${result.description}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Backup sent to Telegram successfully' });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}
