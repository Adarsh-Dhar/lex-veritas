import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    // Allow any authenticated user to get users for case creation
    // This is less restrictive than the full users API
    if (!authorize(user, 'log_evidence')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    // Get all active users with basic info needed for case creation
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        badgeNumber: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return createSuccessResponse({
      users
    })
  } catch (error) {
    console.error('Get users for case creation error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
