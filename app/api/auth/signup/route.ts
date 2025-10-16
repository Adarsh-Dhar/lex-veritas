import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, setAuthCookie, createErrorResponse, createSuccessResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, badgeNumber, role = 'ANALYST', internetIdentityPrincipal } = await request.json()

    // Validate required fields (if II principal provided, password is optional)
    if (!name || !email || !badgeNumber) {
      return createErrorResponse('Name, email, and badge number are required', 400, 'MISSING_FIELDS')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400, 'INVALID_EMAIL')
    }

    // Validate password strength when using password flow
    if (!internetIdentityPrincipal) {
      if (!password || password.length < 6) {
        return createErrorResponse('Password must be at least 6 characters long', 400, 'WEAK_PASSWORD')
      }
    }

    // Validate role
    const validRoles = ['ANALYST', 'PROSECUTOR', 'AUDITOR']
    if (!validRoles.includes(role)) {
      return createErrorResponse('Invalid role. Must be ANALYST, PROSECUTOR, or AUDITOR', 400, 'INVALID_ROLE')
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

    // Hash password only for password-based signup
    const passwordHash = internetIdentityPrincipal ? `ii:${internetIdentityPrincipal}` : await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        principalId: internetIdentityPrincipal || `principal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    // Generate JWT token
    const token = generateToken(user as any)

    // Set authentication cookie
    await setAuthCookie(token)

    return createSuccessResponse(user, 'Account created successfully')
  } catch (error) {
    console.error('Signup error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
