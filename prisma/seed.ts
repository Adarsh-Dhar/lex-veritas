import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create initial admin user if none exists
  const adminExists = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminExists) {
    const adminUser = await prisma.user.create({
      data: {
        principalId: `principal-${Date.now()}`,
        name: 'System Administrator',
        email: 'admin@lexveritas.gov',
        passwordHash: await bcrypt.hash('admin123', 10),
        badgeNumber: 'ADMIN-001',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })
    console.log(`✅ Admin user created: ${adminUser.email}`)
  } else {
    console.log('✅ Admin user already exists')
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
