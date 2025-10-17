"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { FileText, LogOut, Plus } from "lucide-react"

interface SidebarProps {
  currentView: string
  onViewChange: (view: any) => void
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, logout, hasPermission } = useAuth()

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-primary">Lex Veritas</h2>
        <p className="text-xs text-muted-foreground mt-1">{user?.role.replace("_", " ")}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {hasPermission("log_evidence") && (
          <Button
            variant={currentView === "intake" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onViewChange("intake")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Evidence
          </Button>
        )}


        {hasPermission("view_case") && (
          <>
            <Button
              variant={currentView === "cases" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onViewChange("cases")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Cases
            </Button>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive bg-transparent"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
