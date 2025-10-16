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
    const targetUser = await prisma.user.findUnique({
      where: { id },
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
    })

    if (!targetUser) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND')
    }

    return createSuccessResponse(targetUser)
  } catch (error) {
    console.error('Get user error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createErrorResponse('Not authenticated', 401, 'UNAUTHENTICATED')
    }

    const { id } = await params
    // Check if user can update (admin or own profile)
    const isAdmin = authorize(user, 'manage_users')
    const isOwnProfile = user.id === id

    if (!isAdmin && !isOwnProfile) {
      return createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS')
    }

    const body = await request.json()
    const { name, email, badgeNumber, role, status } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND')
    }

    // Only admins can change role and status
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (badgeNumber) updateData.badgeNumber = badgeNumber

    if (isAdmin) {
      if (role) updateData.role = role
      if (status) updateData.status = status
    }

    // Check for email/badge conflicts
    if (email || badgeNumber) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(email ? [{ email }] : []),
            ...(badgeNumber ? [{ badgeNumber }] : []),
          ],
        },
      })

      if (conflictUser) {
        return createErrorResponse('Email or badge number already exists', 400, 'CONFLICT')
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    })

    return createSuccessResponse(updatedUser, 'User updated successfully')
  } catch (error) {
    console.error('Update user error:', error)
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
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return createErrorResponse('User not found', 404, 'USER_NOT_FOUND')
    }

    // Soft delete (set status to INACTIVE)
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })

    return createSuccessResponse(null, 'User deactivated successfully')
  } catch (error) {
    console.error('Delete user error:', error)
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR')
  }
}
