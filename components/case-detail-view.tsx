"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react"

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

interface EvidenceItem {
  id: string
  itemNumber: string
  evidenceType: string
  description: string
  collectedAt: string
  location: string
  reasonForCollection: string
  handlingNotes: string
  initialHash: string
  storyProtocolIpId: string
  icpCanisterId: string
  collectedBy: {
    id: string
    name: string
    badgeNumber: string
  }
}

interface CaseDetailViewProps {
  caseData: CaseData
  onBack: () => void
}

export default function CaseDetailView({ caseData, onBack }: CaseDetailViewProps) {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvidenceItems()
  }, [caseData.id])

  const fetchEvidenceItems = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/cases/${caseData.id}/evidence`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch evidence items')
      }

      const data = await response.json()
      if (data.success) {
        setEvidenceItems(data.data.evidenceItems || [])
      } else {
        throw new Error(data.error || 'Failed to fetch evidence items')
      }
    } catch (err) {
      console.error('Error fetching evidence items:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch evidence items')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Cases
      </Button>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">{caseData.caseNumber}</h1>
          <Badge className="bg-accent/20 text-accent">
            Active
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">Case {caseData.caseNumber}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Lead Investigator</p>
            <p className="font-semibold text-foreground">{caseData.leadInvestigator.name}</p>
            <p className="text-xs text-muted-foreground">{caseData.leadInvestigator.badgeNumber}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Created</p>
            <p className="font-semibold text-foreground">{formatDate(caseData.createdAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Evidence Items</p>
            <p className="font-semibold text-accent text-lg">{evidenceItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
            <p className="font-semibold text-foreground">{formatDate(caseData.updatedAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence Items in This Case</CardTitle>
          <CardDescription>All forensic evidence associated with {caseData.caseNumber}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading evidence items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchEvidenceItems} variant="outline">
                Try Again
              </Button>
            </div>
          ) : evidenceItems.length > 0 ? (
            <div className="space-y-3">
              {evidenceItems.map((item) => (
                <Card key={item.id} className="p-4 border-border/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-foreground">Item #{item.itemNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.evidenceType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Type: {item.evidenceType.replace(/_/g, ' ')}</span>
                        <span>Collected: {formatDate(item.collectedAt)}</span>
                        <span>By: {item.collectedBy.name}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <FileText className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No evidence items found for this case
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>Create court-admissible reports for this case</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Full Case Report
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Chain of Custody Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
