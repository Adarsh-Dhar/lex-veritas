import { clearAuthCookie, createSuccessResponse } from '@/lib/auth'

export async function POST() {
  await clearAuthCookie()
  return createSuccessResponse(null, 'Logout successful')
}
