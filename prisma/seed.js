const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@godhragraduatesforum.in';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
  
  const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // Create initial sports
  const sports = [
    { name: 'Turf Cricket', description: 'Cricket played on artificial turf' },
    { name: 'Kabaddi', description: 'Traditional Indian contact sport' },
    { name: 'Volleyball', description: 'Team sport with ball over net' },
    { name: 'Football', description: 'Association football/soccer' },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { name: sport.name },
      update: {},
      create: sport,
    });
    console.log(`✅ Sport created: ${sport.name}`);
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
