"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"
import CaseDetailView from "./case-detail-view"

interface CaseData {
  id: string
  caseNumber: string
  leadInvestigator: {
    id: string
    name: string
    badgeNumber: string
  }
  createdAt: string
  updatedAt: string
  evidenceItems?: Array<{
    id: string
    itemNumber: string
    evidenceType: string
    description: string
  }>
}

export default function CaseManagementView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed" | "archived">("all")
  const [cases, setCases] = useState<CaseData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/cases', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cases')
      }

      const data = await response.json()
      if (data.success) {
        setCases(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch cases')
      }
    } catch (err) {
      console.error('Error fetching cases:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cases')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.leadInvestigator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.leadInvestigator.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase())

    // For now, all cases are considered "active" since we don't have status in the schema
    const matchesStatus = statusFilter === "all" || statusFilter === "active"

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (selectedCase) {
    return <CaseDetailView caseData={selectedCase} onBack={() => setSelectedCase(null)} />
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Case Management</h1>
          <p className="text-muted-foreground">View all cases and their associated evidence items</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading cases...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Case Management</h1>
          <p className="text-muted-foreground">View all cases and their associated evidence items</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchCases} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
          <CardDescription>Find cases by number or investigator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case number or investigator..."
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
          </div>
        </CardContent>
      </Card>

      {filteredCases.length > 0 ? (
        <div className="grid gap-4">
          {filteredCases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className="cursor-pointer hover:bg-input/30 transition-colors border-border/50"
              onClick={() => setSelectedCase(caseItem)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{caseItem.caseNumber}</h3>
                      <Badge className={getStatusColor("active")}>Active</Badge>
                    </div>
                    <p className="text-foreground mb-3">Case {caseItem.caseNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Lead Investigator</p>
                    <p className="font-medium text-foreground">{caseItem.leadInvestigator.name}</p>
                    <p className="text-xs text-muted-foreground">{caseItem.leadInvestigator.badgeNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Created</p>
                    <p className="font-medium text-foreground">{formatDate(caseItem.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Evidence Items</p>
                    <p className="font-medium text-accent">{caseItem.evidenceItems?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Last Updated</p>
                    <p className="font-medium text-foreground">{formatDate(caseItem.updatedAt)}</p>
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
