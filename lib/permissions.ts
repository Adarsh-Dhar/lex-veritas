export type UserRole = 'ADMIN' | 'ANALYST' | 'PROSECUTOR' | 'AUDITOR'

// Role-based permissions matching the frontend auth-context.tsx structure
export const rolePermissions: Record<UserRole, string[]> = {
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

export function hasPermission(userRole: UserRole, action: string): boolean {
  return rolePermissions[userRole]?.includes(action) ?? false
}

export function requirePermission(userRole: UserRole, action: string): void {
  if (!hasPermission(userRole, action)) {
    throw new Error(`Insufficient permissions. Required: ${action}`)
  }
}
