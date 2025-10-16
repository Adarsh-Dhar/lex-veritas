import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test users
  const users = [
    {
      principalId: 'principal-1',
      name: 'Detective Sarah Chen',
      email: 'analyst@lexveritas.gov',
      passwordHash: await bcrypt.hash('demo123', 10),
      badgeNumber: 'SF-2847',
      role: 'ANALYST' as const,
    },
    {
      principalId: 'principal-2',
      name: 'Prosecutor James Mitchell',
      email: 'prosecutor@lexveritas.gov',
      passwordHash: await bcrypt.hash('demo123', 10),
      badgeNumber: 'SF-2848',
      role: 'PROSECUTOR' as const,
    },
    {
      principalId: 'principal-3',
      name: 'System Administrator',
      email: 'admin@lexveritas.gov',
      passwordHash: await bcrypt.hash('demo123', 10),
      badgeNumber: 'SF-2849',
      role: 'ADMIN' as const,
    },
    {
      principalId: 'principal-4',
      name: 'Dr. Michael Torres',
      email: 'torres@lexveritas.gov',
      passwordHash: await bcrypt.hash('demo123', 10),
      badgeNumber: 'SF-2901',
      role: 'ANALYST' as const,
    },
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    })
    console.log(`✅ User created/updated: ${user.email}`)
  }

  // Create a test case
  const testCase = await prisma.case.upsert({
    where: { caseNumber: 'SF-2025-0087' },
    update: {},
    create: {
      caseNumber: 'SF-2025-0087',
      leadInvestigatorId: (await prisma.user.findUnique({ where: { email: 'analyst@lexveritas.gov' } }))!.id,
    },
  })
  console.log(`✅ Test case created: ${testCase.caseNumber}`)

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
