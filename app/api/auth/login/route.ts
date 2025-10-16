import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, setAuthCookie, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400, 'MISSING_CREDENTIALS')
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        badgeNumber: true,
        status: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return createErrorResponse('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    if (user.status !== 'ACTIVE') {
      return createErrorResponse('Account is not active', 401, 'ACCOUNT_INACTIVE')
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return createErrorResponse('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      badgeNumber: user.badgeNumber,
      status: user.status,
    })

    // Set httpOnly cookie
    await setAuthCookie(token)

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user
    return createSuccessResponse(userWithoutPassword, 'Login successful')
  } catch (error) {
    console.error('Login error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
