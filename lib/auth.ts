import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { hasPermission, type UserRole } from './permissions'

const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'lex-veritas-token'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  badgeNumber: string
  status: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { id: string; email: string; role: UserRole } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole }
  } catch {
    return null
  }
}

export async function authenticate(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      badgeNumber: true,
      status: true,
    },
  })

  if (!user || user.status !== 'ACTIVE') {
    return null
  }

  return user as AuthUser
}

export function authorize(user: AuthUser, action: string): boolean {
  return hasPermission(user.role, action)
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function createErrorResponse(message: string, status: number = 400, code?: string) {
  return Response.json(
    {
      error: message,
      code: code || 'ERROR',
      success: false,
    },
    { status }
  )
}

export function createSuccessResponse(data: any, message?: string) {
  return Response.json({
    success: true,
    data,
    message,
  })
}
