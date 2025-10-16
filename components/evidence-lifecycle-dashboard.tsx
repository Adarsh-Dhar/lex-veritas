"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getCaseEvidence, getEvidenceHistory } from "@/lib/contract"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ArrowRight, FileText, RefreshCw } from "lucide-react"
import ChainOfCustodyView from "./chain-of-custody-view"
import TransferCustodyForm from "./transfer-custody-form"
import LogActionForm from "./log-action-form"
import ReportGenerator from "./report-generator"

interface EvidenceItem {
  id: string
  itemNumber: string
  evidenceType: string
  description: string
  collectedAt: string
  location: string
  initialHash: string
  storyProtocolIpId: string
  icpCanisterId: string
  case: {
    id: string
    caseNumber: string
  }
  collectedBy: {
    id: string
    name: string
    badgeNumber: string
  }
  custodyLogs: {
    id: string
    action: string
    timestamp: string
    notes: string | null
    fromUser: {
      name: string
      badgeNumber: string
    }
    toUser: {
      name: string
      badgeNumber: string
    } | null
  }[]
}

export default function EvidenceLifecycleDashboard() {
  const { hasPermission, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null)
  const [activeTab, setActiveTab] = useState("search")
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch evidence items from canister
  const fetchEvidenceItems = async () => {
    try {
      setLoading(true)
      setError(null)
      // This example assumes you have a known list of case IDs or a way to enumerate evidence.
      // If the contract exposes a listing method, replace this logic accordingly.
      setEvidenceItems([])
    } catch (err) {
      setError('Failed to fetch evidence items')
      console.error('Error fetching evidence items:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load evidence items on component mount
  useEffect(() => {
    fetchEvidenceItems()
  }, [])

  // Log selected vs current role
  useEffect(() => {
    try {
      const selectedRole = typeof window !== 'undefined' ? localStorage.getItem('lv_role_override') || localStorage.getItem('lv_desired_role') : null
      // eslint-disable-next-line no-console
      console.log('[Dashboard] Roles', { selectedRole: selectedRole || user?.role, currentRole: user?.role })
    } catch {}
  }, [user?.role])

  // Filter evidence items based on search query
  const filteredEvidence = evidenceItems.filter(
    (item) =>
      item.case.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.evidenceType.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Evidence Lifecycle Management</h1>
        <p className="text-muted-foreground">Search, track, and manage the chain of custody for all evidence items</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search Evidence</TabsTrigger>
          {hasPermission("transfer_custody") && <TabsTrigger value="transfer">Transfer Custody</TabsTrigger>}
          {hasPermission("log_action") && <TabsTrigger value="action">Log Action</TabsTrigger>}
          {hasPermission("generate_report") && <TabsTrigger value="report">Generate Report</TabsTrigger>}
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Search Evidence Items</CardTitle>
                  <CardDescription>Find evidence by case number, item number, or description</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvidenceItems}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case number, item number, description, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="text-center py-4 text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading evidence items...
                </div>
              ) : filteredEvidence.length > 0 ? (
                <div className="space-y-3">
                  {filteredEvidence.map((item) => (
                    <Card
                      key={item.id}
                      className="p-4 cursor-pointer hover:bg-input/50 transition-colors border-border/50"
                      onClick={() => setSelectedEvidence(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-foreground">{item.case.caseNumber}</span>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              Item #{item.itemNumber}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Type: {item.evidenceType}</span>
                            <span>Collected: {new Date(item.collectedAt).toLocaleString()}</span>
                            <span>By: {item.collectedBy.name} ({item.collectedBy.badgeNumber})</span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No evidence items found" : "Enter a search query to find evidence"}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEvidence && (
            <ChainOfCustodyView evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
          )}
        </TabsContent>

        {hasPermission("transfer_custody") && (
          <TabsContent value="transfer">
            <TransferCustodyForm evidence={filteredEvidence} />
          </TabsContent>
        )}

        {hasPermission("log_action") && (
          <TabsContent value="action">
            <LogActionForm evidence={filteredEvidence} />
          </TabsContent>
        )}

        {hasPermission("generate_report") && (
          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle>Generate Chain of Custody Report</CardTitle>
                <CardDescription>Create a court-admissible PDF report for any evidence item</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading evidence items...
                  </div>
                ) : filteredEvidence.length > 0 ? (
                  <div className="space-y-3">
                    {filteredEvidence.map((item) => (
                      <Card key={item.id} className="p-4 flex items-center justify-between border-border/50">
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.case.caseNumber} - Item #{item.itemNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {item.evidenceType} | Collected: {new Date(item.collectedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          className="gap-2"
                          onClick={() => {
                            setSelectedEvidence(item)
                            setShowReportGenerator(true)
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          Generate PDF
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No evidence items found" : "Search for evidence first to generate a report"}
                  </div>
                )}
              </CardContent>
            </Card>

            {showReportGenerator && selectedEvidence && (
              <ReportGenerator evidence={selectedEvidence} onClose={() => setShowReportGenerator(false)} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
