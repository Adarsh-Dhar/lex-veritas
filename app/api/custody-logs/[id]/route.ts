import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const { id } = await params
    const custodyLog = await prisma.custodyLog.findUnique({
      where: { id },
      include: {
        evidenceItem: {
          select: {
            id: true,
            itemNumber: true,
            description: true,
            evidenceType: true,
            case: {
              select: {
                id: true,
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
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            badgeNumber: true,
            email: true,
          },
        },
      },
    })

    if (!custodyLog) {
      return createErrorResponse('Custody log not found', 404, 'CUSTODY_LOG_NOT_FOUND')
    }

    return createSuccessResponse(custodyLog)
  } catch (error) {
    console.error('Get custody log error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
