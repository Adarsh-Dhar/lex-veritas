"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import IntakeForm from "@/components/intake-form"
import EvidenceLifecycleDashboard from "@/components/evidence-lifecycle-dashboard"
type ViewType = "intake" | "lifecycle"

export default function DashboardLayout() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<ViewType>("lifecycle")

  const renderView = () => {
    switch (currentView) {
      case "intake":
        return <IntakeForm onSubmit={() => setCurrentView("lifecycle")} />
      case "lifecycle":
        return <EvidenceLifecycleDashboard />
      default:
        return <EvidenceLifecycleDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">{renderView()}</div>
        </main>
      </div>
    </div>
  )
}
