"use client"

import { useAuth } from "@/lib/auth-context"
import { Shield, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Lex Veritas 2.0</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-5 w-5" />
            <div>
              <p className="font-medium text-foreground">{user?.name}</p>
              <p className="text-xs">{user?.badge_number || user?.role.replace("_", " ")}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
