import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { Principal } from '@dfinity/principal'
import { getMyProfile } from '@/lib/contract'

const II_COOKIE_NAME = 'ii_principal'

export async function setIiCookie(principalText: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(II_COOKIE_NAME, principalText, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
}

export async function clearIiCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(II_COOKIE_NAME)
}

export function getCurrentPrincipal(request: NextRequest): string | null {
  const principalText = request.cookies.get(II_COOKIE_NAME)?.value
  if (!principalText) return null
  try {
    Principal.fromText(principalText)
    return principalText
  } catch {
    return null
  }
}

export function createErrorResponse(message: string, status: number = 400, code?: string) {
  const payload = makeJsonSafe({
    error: message,
    code: code || 'ERROR',
    success: false,
  })
  return Response.json(payload, { status })
}

export function createSuccessResponse(data: any, message?: string) {
  const payload = makeJsonSafe({
    success: true,
    data,
    message,
  })
  return Response.json(payload)
}

// Convert BigInt and Principal-like values to JSON-safe primitives
function makeJsonSafe(input: any): any {
  if (input === null || input === undefined) return input
  const t = typeof input
  if (t === 'bigint') return input.toString()
  if (t !== 'object') return input

  // Principal from @dfinity/principal
  if (typeof (input as any).toText === 'function' && (input as any).constructor?.name === 'Principal') {
    try {
      return (input as any).toText()
    } catch {
      // fall through
    }
  }

  if (Array.isArray(input)) {
    return input.map((v) => makeJsonSafe(v))
  }

  const output: Record<string, any> = {}
  for (const [k, v] of Object.entries(input)) {
    // Also coerce nested Principals that appear as values
    if (v && typeof (v as any).toText === 'function' && (v as any).constructor?.name === 'Principal') {
      try {
        output[k] = (v as any).toText()
        continue
      } catch {
        // ignore
      }
    }
    output[k] = makeJsonSafe(v)
  }
  return output
}

// -------------------------
// Server-side authentication & authorization helpers
// -------------------------

export type ServerUser = {
  id: string
  role: 'ANALYST' | 'PROSECUTOR' | 'ADMIN' | 'AUDITOR'
  name?: string
  email?: string
  badgeNumber?: string
}

const rolePermissions: Record<ServerUser['role'], string[]> = {
  ANALYST: ['log_evidence', 'transfer_custody', 'log_action', 'view_evidence', 'view_case'],
  PROSECUTOR: ['view_evidence', 'view_case', 'generate_report', 'view_chain_of_custody'],
  ADMIN: [
    'log_evidence',
    'transfer_custody',
    'log_action',
    'view_evidence',
    'view_case',
    'generate_report',
    'view_chain_of_custody',
    'manage_users',
    'manage_permissions',
  ],
  AUDITOR: ['view_evidence', 'view_case', 'view_chain_of_custody'],
}

export async function authenticate(request: NextRequest): Promise<ServerUser | null> {
  const principal = getCurrentPrincipal(request)
  if (!principal) return null
  try {
    const profile = await getMyProfile()
    if (!profile) return null
    // Normalize role variant to string
    const roleVariant = (profile as any).role || {}
    const roleKey = (Object.keys(roleVariant)[0] || 'ANALYST') as ServerUser['role']
    const id = typeof (profile as any).id === 'string'
      ? (profile as any).id
      : (profile as any).id?.toText?.() ?? String((profile as any).id)
    return {
      id,
      role: roleKey,
      name: (profile as any).name,
      email: (profile as any).email,
      badgeNumber: (profile as any).badgeNumber,
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('authenticate error:', e)
    return null
  }
}

export function authorize(user: ServerUser, action: string): boolean {
  const allowed = rolePermissions[user.role]
  return !!allowed && allowed.includes(action)
}
