"use client"

import { Button } from "@/components/ui/button"
import { FolderPlus, Files } from "lucide-react"

interface CasesSidebarProps {
  currentView: string
  onViewChange: (view: string) => void
}

export default function CasesSidebar({ currentView, onViewChange }: CasesSidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-primary">Cases</h2>
        <p className="text-xs text-muted-foreground mt-1">Manage and browse cases</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant={currentView === "create-case" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange("create-case")}
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          New Case
        </Button>

        <Button
          variant={currentView === "cases-list" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange("cases-list")}
        >
          <Files className="w-4 h-4 mr-2" />
          Browse Cases
        </Button>
      </nav>
    </aside>
  )
}


