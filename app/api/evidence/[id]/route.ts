import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const { id } = await params
    const evidenceItem = await prisma.evidenceItem.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
          },
        },
        collectedBy: {
          select: {
            id: true,
            name: true,
            badgeNumber: true,
          },
        },
        custodyLogs: {
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
        },
      },
    })

    if (!evidenceItem) {
      return createErrorResponse('Evidence item not found', 404, 'EVIDENCE_NOT_FOUND')
    }

    return createSuccessResponse(evidenceItem)
  } catch (error) {
    console.error('Get evidence error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'log_evidence')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const { id } = await params
    const body = await request.json()
    const {
      itemNumber,
      evidenceType,
      description,
      location,
      reasonForCollection,
      handlingNotes,
    } = body

    // Check if evidence item exists
    const existingItem = await prisma.evidenceItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return createErrorResponse('Evidence item not found', 404, 'EVIDENCE_NOT_FOUND')
    }

    const updateData: any = {}
    if (itemNumber) updateData.itemNumber = itemNumber
    if (evidenceType) updateData.evidenceType = evidenceType
    if (description) updateData.description = description
    if (location) updateData.location = location
    if (reasonForCollection !== undefined) updateData.reasonForCollection = reasonForCollection
    if (handlingNotes !== undefined) updateData.handlingNotes = handlingNotes

    // Check for item number conflicts if changing
    if (itemNumber && itemNumber !== existingItem.itemNumber) {
      const conflictItem = await prisma.evidenceItem.findFirst({
        where: {
          id: { not: id },
          caseId: existingItem.caseId,
          itemNumber,
        },
      })

      if (conflictItem) {
        return createErrorResponse('Item number already exists in this case', 400, 'ITEM_NUMBER_EXISTS')
      }
    }

    const updatedItem = await prisma.evidenceItem.update({
      where: { id },
      data: updateData,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
          },
        },
        collectedBy: {
          select: {
            id: true,
            name: true,
            badgeNumber: true,
          },
        },
      },
    })

    return createSuccessResponse(updatedItem, 'Evidence item updated successfully')
  } catch (error) {
    console.error('Update evidence error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'manage_users')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const { id } = await params
    // Check if evidence item exists
    const existingItem = await prisma.evidenceItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return createErrorResponse('Evidence item not found', 404, 'EVIDENCE_NOT_FOUND')
    }

    // Delete evidence item (this will cascade to custody logs)
    await prisma.evidenceItem.delete({
      where: { id },
    })

    return createSuccessResponse(null, 'Evidence item deleted successfully')
  } catch (error) {
    console.error('Delete evidence error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
