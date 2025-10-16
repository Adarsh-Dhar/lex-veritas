import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, setAuthCookie, authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin role
    const currentUser = await authenticate(request)
    if (!currentUser) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(currentUser, 'manage_users')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const { name, email, password, badgeNumber, role } = await request.json()

    if (!name || !email || !password || !badgeNumber || !role) {
      return createErrorResponse('All fields are required', 400, 'MISSING_FIELDS')
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { badgeNumber },
        ],
      },
    })

    if (existingUser) {
      return createErrorResponse('User with this email or badge number already exists', 400, 'USER_EXISTS')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        principalId: `principal-${Date.now()}`, // Generate unique principal ID
        name,
        email,
        passwordHash,
        badgeNumber,
        role: role as any,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        badgeNumber: true,
        status: true,
        createdAt: true,
      },
    })

    return createSuccessResponse(user, 'User created successfully')
  } catch (error) {
    console.error('Register error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
