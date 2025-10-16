import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    // Verify evidence item exists
    const evidenceItem = await prisma.evidenceItem.findUnique({
      where: { id: params.id },
    })

    if (!evidenceItem) {
      return createErrorResponse('Evidence item not found', 404, 'EVIDENCE_NOT_FOUND')
    }

    const custodyLogs = await prisma.custodyLog.findMany({
      where: { evidenceItemId: params.id },
      include: {
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
      orderBy: { timestamp: 'asc' },
    })

    return createSuccessResponse(custodyLogs)
  } catch (error) {
    console.error('Get custody logs error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'log_action')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const { action, toUserId, notes } = await request.json()

    if (!action) {
      return createErrorResponse('Action is required', 400, 'MISSING_ACTION')
    }

    // Verify evidence item exists
    const evidenceItem = await prisma.evidenceItem.findUnique({
      where: { id: params.id },
    })

    if (!evidenceItem) {
      return createErrorResponse('Evidence item not found', 404, 'EVIDENCE_NOT_FOUND')
    }

    // Verify toUser exists if provided
    if (toUserId) {
      const toUser = await prisma.user.findUnique({
        where: { id: toUserId },
      })

      if (!toUser) {
        return createErrorResponse('Target user not found', 400, 'TARGET_USER_NOT_FOUND')
      }
    }

    // Generate placeholder blockchain transaction ID
    const timestamp = new Date().toISOString()
    const transactionId = `tx_${crypto.createHash('sha256').update(`${params.id}_${action}_${timestamp}`).digest('hex').substring(0, 16)}`

    // Create custody log
    const custodyLog = await prisma.custodyLog.create({
      data: {
        evidenceItemId: params.id,
        action: action as any,
        timestamp: new Date(),
        fromUserId: user.id,
        toUserId: toUserId || null,
        notes: notes || null,
        storyProtocolTransactionId: transactionId,
      },
      include: {
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
    })

    return createSuccessResponse(custodyLog, 'Custody log created successfully')
  } catch (error) {
    console.error('Create custody log error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
