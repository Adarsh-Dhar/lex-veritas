import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        leadInvestigator: {
          select: {
            id: true,
            name: true,
            badgeNumber: true,
            email: true,
          },
        },
        evidenceItems: {
          select: {
            id: true,
            itemNumber: true,
            evidenceType: true,
            description: true,
            collectedAt: true,
            location: true,
            initialHash: true,
            storyProtocolIpId: true,
            icpCanisterId: true,
            collectedBy: {
              select: {
                id: true,
                name: true,
                badgeNumber: true,
              },
            },
          },
          orderBy: { itemNumber: 'asc' },
        },
        _count: {
          select: {
            evidenceItems: true,
          },
        },
      },
    })

    if (!caseData) {
      return createErrorResponse('Case not found', 404, 'CASE_NOT_FOUND')
    }

    return createSuccessResponse(caseData)
  } catch (error) {
    console.error('Get case error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'log_evidence')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const body = await request.json()
    const { caseNumber, leadInvestigatorId } = body

    // Check if case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: params.id },
    })

    if (!existingCase) {
      return createErrorResponse('Case not found', 404, 'CASE_NOT_FOUND')
    }

    const updateData: any = {}
    if (caseNumber) updateData.caseNumber = caseNumber
    if (leadInvestigatorId) updateData.leadInvestigatorId = leadInvestigatorId

    // Check for case number conflicts
    if (caseNumber) {
      const conflictCase = await prisma.case.findFirst({
        where: {
          id: { not: params.id },
          caseNumber,
        },
      })

      if (conflictCase) {
        return createErrorResponse('Case number already exists', 400, 'CASE_NUMBER_EXISTS')
      }
    }

    // Verify lead investigator exists if provided
    if (leadInvestigatorId) {
      const leadInvestigator = await prisma.user.findUnique({
        where: { id: leadInvestigatorId },
      })

      if (!leadInvestigator) {
        return createErrorResponse('Lead investigator not found', 400, 'INVESTIGATOR_NOT_FOUND')
      }
    }

    const updatedCase = await prisma.case.update({
      where: { id: params.id },
      data: updateData,
      include: {
        leadInvestigator: {
          select: {
            id: true,
            name: true,
            badgeNumber: true,
          },
        },
        _count: {
          select: {
            evidenceItems: true,
          },
        },
      },
    })

    return createSuccessResponse(updatedCase, 'Case updated successfully')
  } catch (error) {
    console.error('Update case error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'manage_users')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    // Check if case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: params.id },
    })

    if (!existingCase) {
      return createErrorResponse('Case not found', 404, 'CASE_NOT_FOUND')
    }

    // Delete case (this will cascade to evidence items and custody logs)
    await prisma.case.delete({
      where: { id: params.id },
    })

    return createSuccessResponse(null, 'Case deleted successfully')
  } catch (error) {
    console.error('Delete case error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
