import { PrismaClient } from '../src/generated/prisma';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with example data...');

  // Clear existing data (preserve structure)
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.room.deleteMany();
  await prisma.department.deleteMany();
  await prisma.setting.deleteMany();

  const hashedPassword = await bcryptjs.hash('admin123', 10);
  const userPassword = await bcryptjs.hash('user123', 10);

  // ──────────────────────────────────────────────
  // 1. DEPARTMENTS
  // ──────────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.create({ data: { name: 'Deputi 1' } }),
    prisma.department.create({ data: { name: 'Deputi 2' } }),
    prisma.department.create({ data: { name: 'Deputi 3' } }),
    prisma.department.create({ data: { name: 'Deputi 4' } }),
    prisma.department.create({ data: { name: 'Inspektorat' } }),
    prisma.department.create({ data: { name: 'Sekretariat' } }),
    prisma.department.create({ data: { name: 'D1 Asdep 1' } }),
    prisma.department.create({ data: { name: 'D1 Asdep 2' } }),
    prisma.department.create({ data: { name: 'D1 Asdep 3' } }),
    prisma.department.create({ data: { name: 'D1 Asdep 4' } }),
    prisma.department.create({ data: { name: 'D2 Asdep 3' } }),
    prisma.department.create({ data: { name: 'D2 Asdep 5' } }),
    prisma.department.create({ data: { name: 'D3 Asdep 3' } }),
    prisma.department.create({ data: { name: 'Staf Ahli' } }),
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  const [dep1, dep2, dep3, dep4, inspektorat, sekretariat,
    d1asdep1, d1asdep2, d1asdep3, d1asdep4, d2asdep3, d2asdep5, d3asdep3, stafAhli] = departments;

  // ──────────────────────────────────────────────
  // 2. ROOMS
  // ──────────────────────────────────────────────
  const mainRoom = await prisma.room.create({
    data: { name: 'Ruang Rapat Utama', isMainRoom: true },
  });

  const deptRooms = await Promise.all([
    prisma.room.create({ data: { name: 'Ruang Deputi 1', departmentId: dep1.id } }),
    prisma.room.create({ data: { name: 'Ruang Deputi 2', departmentId: dep2.id } }),
    prisma.room.create({ data: { name: 'Ruang Deputi 3', departmentId: dep3.id } }),
    prisma.room.create({ data: { name: 'Ruang Deputi 4', departmentId: dep4.id } }),
    prisma.room.create({ data: { name: 'Ruang Inspektorat', departmentId: inspektorat.id } }),
    prisma.room.create({ data: { name: 'Ruang Sekretariat', departmentId: sekretariat.id } }),
  ]);
  console.log(`✅ Created ${deptRooms.length + 1} rooms (including Ruang Rapat Utama)`);

  const [roomDep1, roomDep2, roomDep3, roomDep4, roomInspek, roomSekret] = deptRooms;

  // ──────────────────────────────────────────────
  // 3. EMPLOYEES
  // ──────────────────────────────────────────────
  const employees = await Promise.all([
    // Deputi 1 staff
    prisma.employee.create({ data: { name: 'Ridky Irfan Wirautama, S.Sos, M.A', nip: '198503152010011008', departmentId: d1asdep4.id } }),
    prisma.employee.create({ data: { name: 'Fici Iman Nasetion, S.I.K', nip: '197801052002121003', departmentId: d1asdep1.id } }),
    prisma.employee.create({ data: { name: 'RR. Puspita Narastiti Aprilina H, S.H', nip: '198804152012042001', departmentId: d1asdep2.id } }),
    prisma.employee.create({ data: { name: 'Muhammad Luthfi Hakim, S.IP, M.AP', nip: '199005212015031003', departmentId: d1asdep1.id } }),
    // Deputi 2 staff
    prisma.employee.create({ data: { name: 'Chyntya Syafril', nip: '199207082015032002', departmentId: dep2.id } }),
    prisma.employee.create({ data: { name: 'Gabriel Malona, S.Mn', nip: '198901152013011002', departmentId: d2asdep3.id } }),
    // Deputi 3 staff
    prisma.employee.create({ data: { name: 'Gusti Ngurah Agung Prabawa, S.T', nip: '198605102010011012', departmentId: dep3.id } }),
    prisma.employee.create({ data: { name: 'Ahmad Didin Khoiruddin, S.Kel, M.T', nip: '198712252014031001', departmentId: dep3.id } }),
    prisma.employee.create({ data: { name: 'Tri Wahyu Rahmanto, S.Kel', nip: '199001052015031002', departmentId: dep3.id } }),
    prisma.employee.create({ data: { name: 'Aditya Rizki Pramudita, S.H', nip: '199203182016031004', departmentId: d3asdep3.id } }),
    // Deputi 4 staff
    prisma.employee.create({ data: { name: 'Makna Fathana Sabila, S.Si, M.Si', nip: '199107122017032001', departmentId: dep4.id } }),
    // Inspektorat
    prisma.employee.create({ data: { name: 'Reni Sutaryo, S.Si, M.Adm Pemb', nip: '197706102002122002', departmentId: inspektorat.id } }),
    // Sekretariat
    prisma.employee.create({ data: { name: 'Mahesa Putra, S.ST PAR', nip: '198908152014031001', departmentId: sekretariat.id } }),
    // Staf Ahli
    prisma.employee.create({ data: { name: 'Arina Haqoo Hidayah, S.Si, M.Si', nip: '198410252008042001', departmentId: stafAhli.id } }),
    prisma.employee.create({ data: { name: 'Raja Hukbeei', nip: '197505052000031002', departmentId: stafAhli.id } }),
    // More Deputi staff
    prisma.employee.create({ data: { name: 'Riana Sri Hastuti', nip: '197804102002122003', departmentId: d2asdep5.id } }),
    prisma.employee.create({ data: { name: 'Lailan Maulidyah', nip: '198206052006042002', departmentId: dep2.id } }),
    prisma.employee.create({ data: { name: 'Elga Tiara Putra, S.Hut', nip: '199103152015031004', departmentId: dep1.id } }),
    prisma.employee.create({ data: { name: 'Jarnila Rizki Nuraini, S.Pi', nip: '198906252015032001', departmentId: d3asdep3.id } }),
  ]);
  console.log(`✅ Created ${employees.length} employees`);

  // ──────────────────────────────────────────────
  // 4. USERS
  // ──────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: { username: 'admin', password: hashedPassword, role: 'ADMIN' },
  });

  const userAccounts = await Promise.all([
    prisma.user.create({ data: { username: 'ridky', password: userPassword, role: 'USER', employeeId: employees[0].id } }),
    prisma.user.create({ data: { username: 'fici', password: userPassword, role: 'USER', employeeId: employees[1].id } }),
    prisma.user.create({ data: { username: 'puspita', password: userPassword, role: 'USER', employeeId: employees[2].id } }),
    prisma.user.create({ data: { username: 'luthfi', password: userPassword, role: 'USER', employeeId: employees[3].id } }),
    prisma.user.create({ data: { username: 'chyntya', password: userPassword, role: 'USER', employeeId: employees[4].id } }),
    prisma.user.create({ data: { username: 'gabriel', password: userPassword, role: 'USER', employeeId: employees[5].id } }),
    prisma.user.create({ data: { username: 'gusti', password: userPassword, role: 'USER', employeeId: employees[6].id } }),
    prisma.user.create({ data: { username: 'ahmad', password: userPassword, role: 'USER', employeeId: employees[7].id } }),
    prisma.user.create({ data: { username: 'reni', password: userPassword, role: 'USER', employeeId: employees[11].id } }),
    prisma.user.create({ data: { username: 'mahesa', password: userPassword, role: 'USER', employeeId: employees[12].id } }),
  ]);
  console.log(`✅ Created ${userAccounts.length + 1} users (1 admin + ${userAccounts.length} users)`);

  // ──────────────────────────────────────────────
  // 5. EVENTS — today and next few days
  // ──────────────────────────────────────────────
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const todayStr = fmt(today);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = fmt(tomorrow);
  const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
  const dayAfterStr = fmt(dayAfter);

  const events = await Promise.all([
    // ── TODAY — Ruang Rapat Utama (APPROVED) ──
    prisma.event.create({
      data: {
        title: 'Rakor Integrasi Dokumen Ekspor Pangan',
        roomId: mainRoom.id,
        employeeId: employees[1].id, // Fici
        userId: userAccounts[1].id,
        date: todayStr,
        startTime: '09:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rakor Pedoman Teknis Tim Verval KDKMP',
        roomId: mainRoom.id,
        employeeId: employees[2].id, // Puspita
        userId: userAccounts[2].id,
        date: todayStr,
        startTime: '13:00',
        endTime: '15:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rapat Pembahasan Lahan Kab. Blitar',
        roomId: mainRoom.id,
        employeeId: employees[5].id, // Gabriel
        userId: userAccounts[5].id,
        date: todayStr,
        startTime: '15:30',
        endTime: '17:00',
        status: 'APPROVED',
      },
    }),

    // ── TODAY — Ruang Rapat Utama (PENDING/WAITING) ──
    prisma.event.create({
      data: {
        title: 'Rapat Pembangunan SRUK',
        roomId: mainRoom.id,
        employeeId: employees[6].id, // Gusti
        userId: userAccounts[6].id,
        date: todayStr,
        startTime: '16:00',
        endTime: '18:00',
        status: 'PENDING',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Pembahasan Upaya Peningkatan Daya Saing Logistik',
        roomId: mainRoom.id,
        employeeId: employees[0].id, // Ridky
        userId: userAccounts[0].id,
        date: todayStr,
        startTime: '10:00',
        endTime: '11:30',
        status: 'PENDING',
      },
    }),

    // ── TODAY — Department rooms (AUTO-APPROVED) ──
    prisma.event.create({
      data: {
        title: 'Entry Meeting BPK',
        roomId: roomInspek.id,
        employeeId: employees[11].id, // Reni
        userId: userAccounts[8].id,
        date: todayStr,
        startTime: '09:00',
        endTime: '11:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rapat Koordinasi Pengurangan Kawasan Hutan',
        description: 'Pembahasan kawasan hutan untuk jalan dan terminal di Kabupaten Minahasa',
        roomId: roomDep3.id,
        employeeId: employees[6].id, // Gusti
        userId: userAccounts[6].id,
        date: todayStr,
        startTime: '10:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rapat Pembahasan Kompensasi dan Isu Lahan PSEL',
        roomId: roomDep3.id,
        employeeId: employees[7].id, // Ahmad
        userId: userAccounts[7].id,
        date: todayStr,
        startTime: '14:00',
        endTime: '16:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rapa rebon',
        roomId: roomDep1.id,
        employeeId: employees[17].id, // Elga
        userId: userAccounts[0].id,
        date: todayStr,
        startTime: '10:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),

    // ── TOMORROW events ──
    prisma.event.create({
      data: {
        title: 'Rapat Lanjutan Pembahasan Lalu Lintas Hewan Kurban Tahun 2026',
        roomId: mainRoom.id,
        employeeId: employees[5].id, // Gabriel
        userId: userAccounts[5].id,
        date: tomorrowStr,
        startTime: '09:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rakortas Menteri Evidence dan Pengembangan SUM DKMP',
        roomId: mainRoom.id,
        employeeId: employees[2].id, // Puspita
        userId: userAccounts[2].id,
        date: tomorrowStr,
        startTime: '13:00',
        endTime: '15:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rakornas Komisi NEK dan GRK',
        roomId: mainRoom.id,
        employeeId: employees[7].id, // Ahmad
        userId: userAccounts[7].id,
        date: tomorrowStr,
        startTime: '14:00',
        endTime: '16:00',
        status: 'PENDING',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Pertemuan Dukungan Mitra Instrumen NEK dan Pengendalian GRK',
        roomId: roomDep3.id,
        employeeId: employees[8].id, // Tri Wahyu
        userId: userAccounts[6].id,
        date: tomorrowStr,
        startTime: '09:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rapat Pembahasan Hiliriasi Pertanian dengan Kementan',
        roomId: roomDep2.id,
        employeeId: employees[4].id, // Chyntya
        userId: userAccounts[4].id,
        date: tomorrowStr,
        startTime: '10:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),

    // ── DAY AFTER TOMORROW ──
    prisma.event.create({
      data: {
        title: 'Rakor Persiapan GPM',
        roomId: mainRoom.id,
        employeeId: employees[1].id, // Fici
        userId: userAccounts[1].id,
        date: dayAfterStr,
        startTime: '09:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rapat Penetapan Keadaan Tertentu dalam hal Kekurangan Produksi Garam Nasional',
        roomId: mainRoom.id,
        employeeId: employees[3].id, // Luthfi
        userId: userAccounts[3].id,
        date: dayAfterStr,
        startTime: '13:00',
        endTime: '15:00',
        status: 'APPROVED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rakornas Percepatan Penerapan Teknologi Pengolahan Sampas dan Ekspor Baras Nusantara ke Arab Saudi',
        roomId: mainRoom.id,
        employeeId: employees[10].id, // Makna
        userId: userAccounts[0].id,
        date: dayAfterStr,
        startTime: '15:30',
        endTime: '17:00',
        status: 'PENDING',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Rapat Pembentukan Tim Satgas Keamanan Pangan',
        roomId: roomDep1.id,
        employeeId: employees[0].id, // Ridky
        userId: userAccounts[0].id,
        date: dayAfterStr,
        startTime: '10:00',
        endTime: '12:00',
        status: 'APPROVED',
      },
    }),

    // ── Some REJECTED / CANCELLED examples ──
    prisma.event.create({
      data: {
        title: 'Pembahasan Upaya Peningkatan Daya Saing Logistik (cancel)',
        roomId: mainRoom.id,
        employeeId: employees[0].id,
        userId: userAccounts[0].id,
        date: todayStr,
        startTime: '14:00',
        endTime: '15:00',
        status: 'CANCELLED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Pembahasan Pengembangan SITUK',
        roomId: mainRoom.id,
        employeeId: employees[6].id,
        userId: userAccounts[6].id,
        date: tomorrowStr,
        startTime: '16:00',
        endTime: '17:30',
        status: 'REJECTED',
      },
    }),
  ]);
  console.log(`✅ Created ${events.length} events`);

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  console.log('\n📊 Seed Summary:');
  console.log(`   Departments: ${departments.length}`);
  console.log(`   Rooms: ${deptRooms.length + 1}`);
  console.log(`   Employees: ${employees.length}`);
  console.log(`   Users: ${userAccounts.length + 1} (admin + ${userAccounts.length} users)`);
  console.log(`   Events: ${events.length}`);
  console.log('\n🔑 Login credentials:');
  console.log('   Admin:  admin / admin123');
  console.log('   Users:  ridky, fici, puspita, luthfi, chyntya, gabriel, gusti, ahmad, reni, mahesa / user123');
  console.log('\n🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
