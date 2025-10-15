"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ArrowRight, FileText } from "lucide-react"
import ChainOfCustodyView from "./chain-of-custody-view"
import TransferCustodyForm from "./transfer-custody-form"
import LogActionForm from "./log-action-form"
import ReportGenerator from "./report-generator"

interface EvidenceItem {
  id: string
  caseNumber: string
  itemNumber: string
  description: string
  type: string
  recordedBy: string
  timestamp: string
  hash: string
  ipaRecord: string
  canisterId?: string
  chainOfCustody?: {
    action: string
    actor: string
    timestamp: string
    details: string
    status: string
  }[]
}

// Mock evidence data
const mockEvidence: EvidenceItem[] = [
  {
    id: "1",
    caseNumber: "SF-2025-0087",
    itemNumber: "001",
    description: "Samsung 700z laptop seized from suspect's desk",
    type: "Laptop Hard Drive",
    recordedBy: "Detective Sarah Chen",
    timestamp: "Oct 15, 2025, 10:30:15 AM UTC",
    hash: "0a4f...c3e1",
    ipaRecord: "0x1234...abcd",
    canisterId: "canister-id-xyz...",
    chainOfCustody: [
      {
        action: "Evidence Recorded",
        actor: "Detective Sarah Chen",
        timestamp: "Oct 15, 2025, 10:30:15 AM UTC",
        details: "Initial evidence intake and forensic imaging",
        status: "completed",
      },
      {
        action: "Transferred to Forensic Lab",
        actor: "Detective Sarah Chen",
        timestamp: "Oct 15, 2025, 02:15:42 PM UTC",
        details: "Transferred custody to Dr. Michael Torres",
        status: "completed",
      },
    ],
  },
  {
    id: "2",
    caseNumber: "SF-2025-0087",
    itemNumber: "002",
    description: "iPhone 14 Pro recovered from scene",
    type: "Mobile Phone",
    recordedBy: "Detective Sarah Chen",
    timestamp: "Oct 15, 2025, 11:45:22 AM UTC",
    hash: "b5e2...f9d4",
    ipaRecord: "0x5678...efgh",
    canisterId: "canister-id-abc...",
    chainOfCustody: [
      {
        action: "Evidence Recorded",
        actor: "Detective Sarah Chen",
        timestamp: "Oct 15, 2025, 11:45:22 AM UTC",
        details: "Initial evidence intake and forensic imaging",
        status: "completed",
      },
    ],
  },
]

export default function EvidenceLifecycleDashboard() {
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null)
  const [activeTab, setActiveTab] = useState("search")
  const [showReportGenerator, setShowReportGenerator] = useState(false)

  const filteredEvidence = mockEvidence.filter(
    (item) =>
      item.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
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
              <CardTitle>Search Evidence Items</CardTitle>
              <CardDescription>Find evidence by case number, item number, or description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case number (e.g., SF-2025-0087) or item number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredEvidence.length > 0 ? (
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
                            <span className="font-semibold text-foreground">{item.caseNumber}</span>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              Item #{item.itemNumber}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Type: {item.type}</span>
                            <span>Recorded: {item.timestamp}</span>
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
                {filteredEvidence.length > 0 ? (
                  <div className="space-y-3">
                    {filteredEvidence.map((item) => (
                      <Card key={item.id} className="p-4 flex items-center justify-between border-border/50">
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.caseNumber} - Item #{item.itemNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
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
                    Search for evidence first to generate a report
                  </div>
                )}
              </CardContent>
            </Card>

            {showReportGenerator && selectedEvidence && (
              <ReportGenerator evidence={selectedEvidence as any} onClose={() => setShowReportGenerator(false)} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
