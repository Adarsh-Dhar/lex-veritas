import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    // Verify case exists
    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
    })

    if (!caseData) {
      return createErrorResponse('Case not found', 404, 'CASE_NOT_FOUND')
    }

    const evidenceItems = await prisma.evidenceItem.findMany({
      where: { caseId: params.id },
      include: {
        collectedBy: {
          select: {
            id: true,
            name: true,
            badgeNumber: true,
          },
        },
        custodyLogs: {
          select: {
            id: true,
            action: true,
            timestamp: true,
            fromUser: {
              select: {
                name: true,
                badgeNumber: true,
              },
            },
            toUser: {
              select: {
                name: true,
                badgeNumber: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { itemNumber: 'asc' },
    })

    return createSuccessResponse(evidenceItems)
  } catch (error) {
    console.error('Get case evidence error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
