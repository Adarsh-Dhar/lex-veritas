"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type UserRole = "forensic_analyst" | "prosecutor" | "administrator"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  badge_number?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (action: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role-based permissions
const rolePermissions: Record<UserRole, string[]> = {
  forensic_analyst: ["log_evidence", "transfer_custody", "log_action", "view_evidence", "view_case"],
  prosecutor: ["view_evidence", "view_case", "generate_report", "view_chain_of_custody"],
  administrator: [
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("lex_veritas_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Failed to parse stored user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate authentication - in production, this would call a backend API
    setIsLoading(true)
    try {
      // Mock users for demo
      const mockUsers: Record<string, User> = {
        "analyst@lexveritas.gov": {
          id: "1",
          email: "analyst@lexveritas.gov",
          name: "Detective Sarah Chen",
          role: "forensic_analyst",
          badge_number: "SF-2847",
        },
        "prosecutor@lexveritas.gov": {
          id: "2",
          email: "prosecutor@lexveritas.gov",
          name: "Prosecutor James Mitchell",
          role: "prosecutor",
        },
        "admin@lexveritas.gov": {
          id: "3",
          email: "admin@lexveritas.gov",
          name: "System Administrator",
          role: "administrator",
        },
      }

      const foundUser = mockUsers[email]
      if (foundUser && password === "demo123") {
        setUser(foundUser)
        localStorage.setItem("lex_veritas_user", JSON.stringify(foundUser))
      } else {
        throw new Error("Invalid credentials")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("lex_veritas_user")
  }

  const hasPermission = (action: string): boolean => {
    if (!user) return false
    return rolePermissions[user.role].includes(action)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
