"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { AuthClient } from "@dfinity/auth-client"
import { createAuthenticatedContractActor, resetContractActorCache, getMyProfile as contractGetMyProfile } from "@/lib/contract"

export type UserRole = "ANALYST" | "PROSECUTOR" | "ADMIN" | "AUDITOR"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  badgeNumber?: string
  status?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, badgeNumber: string, role?: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (action: string) => boolean
  loginWithII: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role-based permissions matching the backend
const rolePermissions: Record<UserRole, string[]> = {
  ANALYST: ["log_evidence", "transfer_custody", "log_action", "view_evidence", "view_case"],
  PROSECUTOR: ["view_evidence", "view_case", "generate_report", "view_chain_of_custody"],
  ADMIN: [
    "log_evidence",
    "transfer_custody",
    "log_action",
    "view_evidence",
    "view_case",
    "generate_report",
    "view_chain_of_custody",
    "manage_users",
    "manage_permissions",
  ],
  AUDITOR: ["view_evidence", "view_case", "view_chain_of_custody"],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    restoreInternetIdentitySession()
  }, [])

  const restoreInternetIdentitySession = async () => {
    try {
      const authClient = await AuthClient.create()
      const isAuthed = await authClient.isAuthenticated()
      if (!isAuthed) return
      const identity = await authClient.getIdentity()
      try {
        const actor = await createAuthenticatedContractActor(identity)
        const profileOpt = await actor.getMyProfile()
        const profile = profileOpt && profileOpt[0]
        if (profile) {
          setUser(mapContractUserToAuthUser(profile))
        } else {
          setUser({
            id: identity.getPrincipal().toText(),
            email: "",
            name: "Authenticated User",
            role: 'ANALYST',
            badgeNumber: undefined,
            status: 'ACTIVE',
          })
        }
      } catch {
        // Local replica query-signature issues: proceed with minimal user
        setUser({
          id: identity.getPrincipal().toText(),
          email: "",
          name: "Authenticated User",
          role: 'ANALYST',
          badgeNumber: undefined,
          status: 'ACTIVE',
        })
      }
    } catch (e) {
      console.error('Failed to restore II session:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    // Username/password flow removed; enforce II only
    throw new Error('Use Internet Identity login')
  }

  const signup = async (name: string, email: string, password: string, badgeNumber: string, role: string = 'ANALYST') => {
    // Email/password signup removed; accounts managed on-chain. Use II + on-chain registration flows.
    throw new Error('Signup disabled. Use Internet Identity and on-chain registration.')
  }

  const loginWithII = async () => {
    setIsLoading(true)
    try {
      const authClient = await AuthClient.create()
      const iiUrl = process.env.NEXT_PUBLIC_II_URL || 'https://identity.internetcomputer.org'
      const isLocalII = iiUrl.startsWith('http://127.0.0.1:4943')

      await authClient.login({
        identityProvider: iiUrl,
        ...(isLocalII ? { derivationOrigin: window.location.origin } : {}),
        onSuccess: async () => {
          const identity = await authClient.getIdentity()
          const actor = await createAuthenticatedContractActor(identity)
          const profileOpt = await actor.getMyProfile()
          const profile = profileOpt && profileOpt[0]
          if (profile) {
            setUser(mapContractUserToAuthUser(profile))
          } else {
            setUser({
              id: identity.getPrincipal().toText(),
              email: "",
              name: "Authenticated User",
              role: 'ANALYST',
              badgeNumber: undefined,
              status: 'ACTIVE',
            })
          }
          window.location.href = '/'
        },
      })
    } catch (error) {
      console.error('II login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const authClient = await AuthClient.create()
      await authClient.logout()
      resetContractActorCache()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const hasPermission = (action: string): boolean => {
    if (!user) return false
    return rolePermissions[user.role]?.includes(action) ?? false
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, hasPermission, loginWithII }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Map canister User (with variant role) to app User type
function mapContractUserToAuthUser(contractUser: any): User {
  const roleVariant = contractUser.role
  let role: UserRole = 'ANALYST'
  if (roleVariant.ADMIN !== undefined) role = 'ADMIN'
  else if (roleVariant.ANALYST !== undefined) role = 'ANALYST'
  else if (roleVariant.PROSECUTOR !== undefined) role = 'PROSECUTOR'
  else if (roleVariant.AUDITOR !== undefined) role = 'AUDITOR'

  return {
    id: typeof contractUser.id === 'string' ? contractUser.id : contractUser.id.toText?.() ?? String(contractUser.id),
    email: contractUser.email,
    name: contractUser.name,
    role,
    badgeNumber: contractUser.badgeNumber,
    status: (contractUser.status && Object.keys(contractUser.status)[0]) || 'ACTIVE',
  }
}
