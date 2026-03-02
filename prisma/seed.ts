import { PrismaClient } from '../src/generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcryptjs from 'bcryptjs';

const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcryptjs.hash('admin123', 10);

  await prisma.user.create({
    data: { username: 'admin', password: hashedPassword, role: 'ADMIN' },
  });
  console.log('✅ Created admin user (admin / admin123)');

  await prisma.room.create({
    data: { name: 'Ruang Utama', isMainRoom: true },
  });
  console.log('✅ Created main room (Ruang Utama)');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
