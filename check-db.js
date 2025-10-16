const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    }
  })
  
  console.log('Users in database:')
  users.forEach(user => {
    console.log(`- ${user.id}: ${user.email} (${user.name})`)
  })
  
  const cases = await prisma.case.findMany({
    select: {
      id: true,
      caseNumber: true,
      leadInvestigatorId: true,
    }
  })
  
  console.log('\nCases in database:')
  cases.forEach(case_ => {
    console.log(`- ${case_.id}: ${case_.caseNumber} (Lead: ${case_.leadInvestigatorId})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
