import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const { searchParams } = new URL(request.url)
    const evidenceItemId = searchParams.get('evidenceItemId')
    const fromUserId = searchParams.get('fromUserId')
    const toUserId = searchParams.get('toUserId')
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (evidenceItemId) where.evidenceItemId = evidenceItemId
    if (fromUserId) where.fromUserId = fromUserId
    if (toUserId) where.toUserId = toUserId
    if (action) where.action = action

    const [custodyLogs, total] = await Promise.all([
      prisma.custodyLog.findMany({
        where,
        include: {
          evidenceItem: {
            select: {
              id: true,
              itemNumber: true,
              description: true,
              case: {
                select: {
                  caseNumber: true,
                },
              },
            },
          },
          fromUser: {
            select: {
              id: true,
              name: true,
              badgeNumber: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              badgeNumber: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.custodyLog.count({ where }),
    ])

    return createSuccessResponse({
      custodyLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get custody logs error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
