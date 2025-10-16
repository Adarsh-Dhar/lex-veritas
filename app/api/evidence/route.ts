import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import crypto from 'crypto'

// Helper function to generate placeholder blockchain IDs
function generatePlaceholderIds(hash: string) {
  const timestamp = Date.now().toString(16)
  const storyProtocolIpId = `0x${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}-${timestamp}`
  const icpCanisterId = `canister-${hash.substring(0, 12)}...-${timestamp}`
  return { storyProtocolIpId, icpCanisterId }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    const evidenceType = searchParams.get('evidenceType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (caseId) where.caseId = caseId
    if (evidenceType) where.evidenceType = evidenceType

    const [evidenceItems, total] = await Promise.all([
      prisma.evidenceItem.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { collectedAt: 'desc' },
      }),
      prisma.evidenceItem.count({ where }),
    ])

    return createSuccessResponse({
      evidenceItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get evidence error:', error)
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

    const {
      caseId,
      itemNumber,
      evidenceType,
      description,
      collectedAt,
      location,
      reasonForCollection,
      handlingNotes,
      fileData,
      collectedById,
    } = await request.json()

    if (!caseId || !itemNumber || !evidenceType || !description || !collectedAt || !location || !fileData || !collectedById) {
      return createErrorResponse('All required fields must be provided', 400, 'MISSING_FIELDS')
    }

    // Verify case exists
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
    })

    if (!caseData) {
      return createErrorResponse('Case not found', 400, 'CASE_NOT_FOUND')
    }

    // Verify collector exists
    const collector = await prisma.user.findUnique({
      where: { id: collectedById },
    })

    if (!collector) {
      return createErrorResponse('Collector not found', 400, 'COLLECTOR_NOT_FOUND')
    }

    // Check if item number already exists in this case
    const existingItem = await prisma.evidenceItem.findUnique({
      where: {
        caseId_itemNumber: {
          caseId,
          itemNumber,
        },
      },
    })

    if (existingItem) {
      return createErrorResponse('Item number already exists in this case', 400, 'ITEM_EXISTS')
    }

    // Generate hash from base64 file data
    const fileBuffer = Buffer.from(fileData, 'base64')
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    const timestamp = Date.now().toString(16)
    const shortHash = `${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}-${timestamp}`

    // Generate placeholder blockchain IDs
    const { storyProtocolIpId, icpCanisterId } = generatePlaceholderIds(hash)

    // Create evidence item
    const evidenceItem = await prisma.evidenceItem.create({
      data: {
        caseId,
        itemNumber,
        evidenceType: evidenceType as any,
        description,
        collectedAt: new Date(collectedAt),
        location,
        reasonForCollection,
        handlingNotes,
        initialHash: shortHash,
        storyProtocolIpId,
        icpCanisterId,
        collectedById,
      },
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

    // Create initial custody log for collection
    await prisma.custodyLog.create({
      data: {
        evidenceItemId: evidenceItem.id,
        action: 'COLLECTION',
        timestamp: new Date(collectedAt),
        fromUserId: collectedById,
        notes: 'Initial evidence collection',
        storyProtocolTransactionId: `tx_${hash.substring(0, 16)}-${timestamp}`,
      },
    })

    return createSuccessResponse(evidenceItem, 'Evidence item created successfully')
  } catch (error) {
    console.error('Create evidence error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.error('Error stack:', error.stack)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
