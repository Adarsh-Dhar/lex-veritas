import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { createCase as createCaseOnChain } from '@/lib/contract'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const { searchParams } = new URL(request.url)
    const leadInvestigatorId = searchParams.get('leadInvestigatorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (leadInvestigatorId) where.leadInvestigatorId = leadInvestigatorId

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          leadInvestigator: {
            select: {
              id: true,
              name: true,
              badgeNumber: true,
            },
          },
          evidenceItems: {
            select: {
              id: true,
              itemNumber: true,
              evidenceType: true,
              description: true,
              collectedAt: true,
            },
          },
          _count: {
            select: {
              evidenceItems: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.case.count({ where }),
    ])

    return createSuccessResponse({
      cases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get cases error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'log_evidence')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const { caseNumber, leadInvestigatorId } = await request.json()

    if (!caseNumber || !leadInvestigatorId) {
      return createErrorResponse('Case number and lead investigator ID are required', 400, 'MISSING_FIELDS')
    }

    // Check if case number already exists
    const existingCase = await prisma.case.findUnique({
      where: { caseNumber },
    })

    if (existingCase) {
      return createErrorResponse('Case with this number already exists', 400, 'CASE_EXISTS')
    }

    // Verify lead investigator exists
    const leadInvestigator = await prisma.user.findUnique({
      where: { id: leadInvestigatorId },
    })

    if (!leadInvestigator) {
      return createErrorResponse('Lead investigator not found', 400, 'INVESTIGATOR_NOT_FOUND')
    }

    // First create the case on-chain; only proceed if successful
    const onchainResult = await createCaseOnChain(caseNumber)
    if ('err' in onchainResult) {
      return createErrorResponse(`On-chain error: ${onchainResult.err}`, 400, 'ONCHAIN_ERROR')
    }

    // Create case in the database
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        leadInvestigatorId,
      },
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

    return createSuccessResponse(newCase, 'Case created successfully')
  } catch (error) {
    console.error('Create case error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
