"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

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
    // Check if user is already logged in by calling the /api/auth/me endpoint
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUser(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.success && data.data) {
        setUser(data.data)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string, badgeNumber: string, role: string = 'ANALYST') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ name, email, password, badgeNumber, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      if (data.success && data.data) {
        setUser(data.data)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      })
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
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, hasPermission }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
