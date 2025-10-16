import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const { id } = await params
    const { fileData } = await request.json()

    if (!fileData) {
      return createErrorResponse('File data is required', 400, 'MISSING_FILE_DATA')
    }

    // Get evidence item
    const evidenceItem = await prisma.evidenceItem.findUnique({
      where: { id },
      select: {
        id: true,
        initialHash: true,
        storyProtocolIpId: true,
        icpCanisterId: true,
      },
    })

    if (!evidenceItem) {
      return createErrorResponse('Evidence item not found', 404, 'EVIDENCE_NOT_FOUND')
    }

    // Calculate hash from provided file data
    const fileBuffer = Buffer.from(fileData, 'base64')
    const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    const shortCalculatedHash = `${calculatedHash.substring(0, 4)}...${calculatedHash.substring(calculatedHash.length - 4)}`

    // Compare with stored hash
    const isMatch = evidenceItem.initialHash === shortCalculatedHash

    return createSuccessResponse({
      evidenceId: evidenceItem.id,
      storedHash: evidenceItem.initialHash,
      calculatedHash: shortCalculatedHash,
      isMatch,
      storyProtocolIpId: evidenceItem.storyProtocolIpId,
      icpCanisterId: evidenceItem.icpCanisterId,
      verificationTimestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Verify evidence error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
