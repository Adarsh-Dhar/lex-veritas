import { NextRequest } from 'next/server'
import { authenticate, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    return createSuccessResponse(user)
  } catch (error) {
    console.error('Get current user error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
