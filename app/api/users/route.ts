import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, authorize, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'manage_users')) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (role) where.role = role
    if (status) where.status = status

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          badgeNumber: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return createSuccessResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    if (!authorize(user, 'manage_users')) {
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
    const { hashPassword } = await import('@/lib/auth')
    const passwordHash = await hashPassword(password)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        principalId: `principal-${Date.now()}`,
        name,
        email,
        passwordHash,
        badgeNumber,
        role: role as any,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        badgeNumber: true,
        status: true,
        createdAt: true,
      },
    })

    return createSuccessResponse(newUser, 'User created successfully')
  } catch (error) {
    console.error('Create user error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
