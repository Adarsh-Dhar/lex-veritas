"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import CaseDetailView from "./case-detail-view"

interface CaseData {
  caseNumber: string
  title: string
  status: "active" | "closed" | "archived"
  investigator: string
  createdDate: string
  evidenceCount: number
  lastUpdated: string
}

// Mock case data
const mockCases: CaseData[] = [
  {
    caseNumber: "SF-2025-0087",
    title: "Digital Fraud Investigation - Tech Startup",
    status: "active",
    investigator: "Detective Sarah Chen",
    createdDate: "Oct 10, 2025",
    evidenceCount: 2,
    lastUpdated: "Oct 17, 2025",
  },
  {
    caseNumber: "SF-2025-0086",
    title: "Cybercrime - Data Breach",
    status: "active",
    investigator: "Detective James Rodriguez",
    createdDate: "Oct 5, 2025",
    evidenceCount: 5,
    lastUpdated: "Oct 16, 2025",
  },
  {
    caseNumber: "SF-2025-0085",
    title: "Identity Theft Ring",
    status: "closed",
    investigator: "Detective Sarah Chen",
    createdDate: "Sep 20, 2025",
    evidenceCount: 8,
    lastUpdated: "Oct 12, 2025",
  },
]

export default function CaseManagementView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed" | "archived">("all")

  const filteredCases = mockCases.filter((caseItem) => {
    const matchesSearch =
      caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.investigator.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent/20 text-accent border-accent/30"
      case "closed":
        return "bg-muted/20 text-muted-foreground border-muted/30"
      case "archived":
        return "bg-muted/10 text-muted-foreground border-muted/20"
      default:
        return ""
    }
  }

  if (selectedCase) {
    return <CaseDetailView caseData={selectedCase} onBack={() => setSelectedCase(null)} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Case Management</h1>
        <p className="text-muted-foreground">View all cases and their associated evidence items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Cases</CardTitle>
          <CardDescription>Find cases by number, title, or investigator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case number, title, or investigator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              All Cases
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "closed" ? "default" : "outline"}
              onClick={() => setStatusFilter("closed")}
              size="sm"
            >
              Closed
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              onClick={() => setStatusFilter("archived")}
              size="sm"
            >
              Archived
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredCases.length > 0 ? (
        <div className="grid gap-4">
          {filteredCases.map((caseItem) => (
            <Card
              key={caseItem.caseNumber}
              className="cursor-pointer hover:bg-input/30 transition-colors border-border/50"
              onClick={() => setSelectedCase(caseItem)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{caseItem.caseNumber}</h3>
                      <Badge className={getStatusColor(caseItem.status)}>{caseItem.status}</Badge>
                    </div>
                    <p className="text-foreground mb-3">{caseItem.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Investigator</p>
                    <p className="font-medium text-foreground">{caseItem.investigator}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Created</p>
                    <p className="font-medium text-foreground">{caseItem.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Evidence Items</p>
                    <p className="font-medium text-accent">{caseItem.evidenceCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Last Updated</p>
                    <p className="font-medium text-foreground">{caseItem.lastUpdated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            {searchQuery ? "No cases found matching your search" : "No cases available"}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
