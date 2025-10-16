import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    return Response.json({ success: true, user: user?.email || 'No users found' })
  } catch (error) {
    console.error('Test error:', error)
    return Response.json({ success: false, error: error.message })
  }
}
