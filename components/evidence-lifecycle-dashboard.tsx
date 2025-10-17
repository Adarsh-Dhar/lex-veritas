"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getCaseEvidence, getEvidenceHistory, listCases } from "@/lib/contract"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [showCaseDialog, setShowCaseDialog] = useState(false)
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string | null>(null)
  const [prefillEvidenceId, setPrefillEvidenceId] = useState<string | null>(null)

  // Fetch evidence items from canister
  const fetchEvidenceItems = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all known cases
      const cases = await listCases()
      if (cases.length === 0) {
        // Dev/mock fallback: try to load all evidence directly from local storage
        try {
          if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem('lv_mock_evidence')
            if (raw) {
              const list = JSON.parse(raw) as any[]
              const mapped: EvidenceItem[] = list.map((found: any) => ({
                id: found.id,
                itemNumber: found.itemNumber,
                evidenceType: String(found.evidenceType || 'OTHER'),
                description: found.description,
                collectedAt: found.collectedAt || new Date().toISOString(),
                location: found.location,
                initialHash: found.initialHash,
                storyProtocolIpId: found.storyProtocolIpId,
                icpCanisterId: found.icpCanisterId,
                case: {
                  id: found.case?.id || '',
                  caseNumber: found.case?.caseNumber || 'UNKNOWN-CASE',
                },
                collectedBy: {
                  id: found.collectedBy?.id || '',
                  name: found.collectedBy?.name || 'Unknown',
                  badgeNumber: found.collectedBy?.badgeNumber || 'N/A',
                },
                custodyLogs: Array.isArray(found.custodyLogs) ? found.custodyLogs.map((log: any) => ({
                  id: log.id,
                  action: String(log.action || 'UNKNOWN'),
                  timestamp: log.timestamp || new Date().toISOString(),
                  notes: log.notes ?? null,
                  fromUser: { name: log.fromUser?.name || 'Unknown', badgeNumber: log.fromUser?.badgeNumber || 'N/A' },
                  toUser: log.toUser ? { name: log.toUser?.name || 'Unknown', badgeNumber: log.toUser?.badgeNumber || 'N/A' } : null,
                })) : [],
              }))
              setEvidenceItems(mapped)
              return
            }
          }
        } catch {}
        setEvidenceItems([])
        return
      }

      const allEvidence: EvidenceItem[] = []

      // Helper: local fallback resolver (returns ALL matches for an ID variant)
      const resolveLocalEvidenceAll = (evidenceId: string, caseNumber: string) => {
        try {
          if (typeof window === 'undefined') return null
          const raw = window.localStorage.getItem('lv_mock_evidence')
          if (!raw) return null
          const list = JSON.parse(raw) as any[]
          const matches = list.filter(e => (
            e.id === evidenceId || `CASE-${e?.case?.id}-${e?.itemNumber}` === evidenceId || `${e?.case?.caseNumber}-${e?.itemNumber}` === evidenceId
          ))
          if (!matches.length) return null
          const mapped: EvidenceItem[] = matches.map((found: any) => ({
            id: found.id || `CASE-${found?.case?.id}-${found?.itemNumber}`,
            itemNumber: found.itemNumber,
            evidenceType: String(found.evidenceType || 'OTHER'),
            description: found.description,
            collectedAt: found.collectedAt || new Date().toISOString(),
            location: found.location,
            initialHash: found.initialHash,
            storyProtocolIpId: found.storyProtocolIpId,
            icpCanisterId: found.icpCanisterId,
            case: {
              id: found.case?.id,
              caseNumber: found.case?.caseNumber || caseNumber,
            },
            collectedBy: {
              id: found.collectedBy?.id || '',
              name: found.collectedBy?.name || 'Unknown',
              badgeNumber: found.collectedBy?.badgeNumber || 'N/A',
            },
            custodyLogs: Array.isArray(found.custodyLogs) ? found.custodyLogs.map((log: any) => ({
              id: log.id,
              action: String(log.action || 'UNKNOWN'),
              timestamp: log.timestamp || new Date().toISOString(),
              notes: log.notes ?? null,
              fromUser: { name: log.fromUser?.name || 'Unknown', badgeNumber: log.fromUser?.badgeNumber || 'N/A' },
              toUser: log.toUser ? { name: log.toUser?.name || 'Unknown', badgeNumber: log.toUser?.badgeNumber || 'N/A' } : null,
            })) : [],
          }))
          return mapped
        } catch {
          return null
        }
      }

      // For each case, get evidence IDs and then fetch evidence details
      for (const caseItem of cases) {
        try {
          const evidenceIds = await getCaseEvidence(caseItem.id)
          if (evidenceIds && evidenceIds.length > 0) {
            // For each evidence ID, get the full evidence details
            for (const evidenceId of evidenceIds) {
              try {
                const evidenceDetails = await getEvidenceHistory(evidenceId)
                const fromLocalAll = evidenceDetails ? null : resolveLocalEvidenceAll(evidenceId, caseItem.caseNumber)
                if (fromLocalAll && Array.isArray(fromLocalAll)) {
                  for (const resolved of fromLocalAll) {
                    const evidenceItem: EvidenceItem = {
                      id: resolved.id,
                      itemNumber: resolved.itemNumber,
                      evidenceType: typeof resolved.evidenceType === 'object' ? (Object.keys(resolved.evidenceType)[0] || 'OTHER') : String(resolved.evidenceType || 'OTHER'),
                      description: resolved.description,
                      collectedAt: typeof resolved.collectedAt === 'bigint' ? new Date(Number(resolved.collectedAt)).toISOString() : (resolved.collectedAt as any),
                      location: resolved.location,
                      initialHash: resolved.initialHash,
                      storyProtocolIpId: resolved.storyProtocolIpId,
                      icpCanisterId: resolved.icpCanisterId,
                      case: {
                        id: (resolved.case && resolved.case.id) ? resolved.case.id : caseItem.id,
                        caseNumber: (resolved.case && resolved.case.caseNumber) ? resolved.case.caseNumber : caseItem.caseNumber,
                      },
                      collectedBy: {
                        id: (resolved.collectedBy && resolved.collectedBy.id) || '',
                        name: (resolved.collectedBy && resolved.collectedBy.name) ? resolved.collectedBy.name : "Unknown",
                        badgeNumber: (resolved.collectedBy && resolved.collectedBy.badgeNumber) ? resolved.collectedBy.badgeNumber : "N/A",
                      },
                      custodyLogs: Array.isArray(resolved.custodyLogs) ? resolved.custodyLogs.map((log: any) => ({
                        id: log.id,
                        action: typeof log.action === 'object' ? (Object.keys(log.action)[0] || 'UNKNOWN') : String(log.action || 'UNKNOWN'),
                        timestamp: typeof log.timestamp === 'bigint' ? new Date(Number(log.timestamp)).toISOString() : (log.timestamp || new Date().toISOString()),
                        notes: log.notes ?? null,
                        fromUser: { name: log.fromUser?.name || 'Unknown', badgeNumber: log.fromUser?.badgeNumber || 'N/A' },
                        toUser: log.toUser ? { name: log.toUser?.name || 'Unknown', badgeNumber: log.toUser?.badgeNumber || 'N/A' } : null,
                      })) : [],
                    }
                    allEvidence.push(evidenceItem)
                  }
                } else {
                  const resolved = (evidenceDetails || fromLocalAll) as any
                  if (resolved) {
                    const evidenceItem: EvidenceItem = {
                      id: resolved.id,
                      itemNumber: resolved.itemNumber,
                      evidenceType: typeof resolved.evidenceType === 'object' ? (Object.keys(resolved.evidenceType)[0] || 'OTHER') : String(resolved.evidenceType || 'OTHER'),
                      description: resolved.description,
                      collectedAt: typeof resolved.collectedAt === 'bigint' ? new Date(Number(resolved.collectedAt)).toISOString() : (resolved.collectedAt as any),
                      location: resolved.location,
                      initialHash: resolved.initialHash,
                      storyProtocolIpId: resolved.storyProtocolIpId,
                      icpCanisterId: resolved.icpCanisterId,
                      case: {
                        id: (resolved.case && resolved.case.id) ? resolved.case.id : caseItem.id,
                        caseNumber: (resolved.case && resolved.case.caseNumber) ? resolved.case.caseNumber : caseItem.caseNumber,
                      },
                      collectedBy: {
                        id: (resolved.collectedBy && resolved.collectedBy.id) || '',
                        name: (resolved.collectedBy && resolved.collectedBy.name) ? resolved.collectedBy.name : "Unknown",
                        badgeNumber: (resolved.collectedBy && resolved.collectedBy.badgeNumber) ? resolved.collectedBy.badgeNumber : "N/A",
                      },
                      custodyLogs: Array.isArray(resolved.custodyLogs) ? resolved.custodyLogs.map((log: any) => ({
                        id: log.id,
                        action: typeof log.action === 'object' ? (Object.keys(log.action)[0] || 'UNKNOWN') : String(log.action || 'UNKNOWN'),
                        timestamp: typeof log.timestamp === 'bigint' ? new Date(Number(log.timestamp)).toISOString() : (log.timestamp || new Date().toISOString()),
                        notes: log.notes ?? null,
                        fromUser: { name: log.fromUser?.name || 'Unknown', badgeNumber: log.fromUser?.badgeNumber || 'N/A' },
                        toUser: log.toUser ? { name: log.toUser?.name || 'Unknown', badgeNumber: log.toUser?.badgeNumber || 'N/A' } : null,
                      })) : [],
                    }
                    allEvidence.push(evidenceItem)
                  }
                }
              } catch (evidenceErr) {
                // Swallow per-item errors in dev to avoid noisy logs
              }
            }
          }
        } catch (caseErr) {
          // Swallow per-case errors in dev
        }
      }

      // Additional fallback: if we still have no evidence from cases, try known evidence id map in localStorage
      if (allEvidence.length === 0) {
        try {
          if (typeof window !== 'undefined') {
            const mapRaw = window.localStorage.getItem('lv_case_evidence_ids')
            if (mapRaw) {
              const map = JSON.parse(mapRaw) as Record<string, string[]>
              const ids = new Set<string>()
              Object.values(map).forEach(arr => Array.isArray(arr) && arr.forEach(id => ids.add(id)))
              for (const evidenceId of ids) {
                try {
                  const evidenceDetails = await getEvidenceHistory(evidenceId)
                  const fromLocalAll = evidenceDetails ? null : resolveLocalEvidenceAll(evidenceId, 'UNKNOWN-CASE')
                  if (fromLocalAll && Array.isArray(fromLocalAll)) {
                    for (const resolved of fromLocalAll) {
                      const evidenceItem: EvidenceItem = {
                        id: resolved.id,
                        itemNumber: resolved.itemNumber,
                        evidenceType: typeof resolved.evidenceType === 'object' ? (Object.keys(resolved.evidenceType)[0] || 'OTHER') : String(resolved.evidenceType || 'OTHER'),
                        description: resolved.description,
                        collectedAt: typeof resolved.collectedAt === 'bigint' ? new Date(Number(resolved.collectedAt)).toISOString() : (resolved.collectedAt as any),
                        location: resolved.location,
                        initialHash: resolved.initialHash,
                        storyProtocolIpId: resolved.storyProtocolIpId,
                        icpCanisterId: resolved.icpCanisterId,
                        case: {
                          id: (resolved.case && resolved.case.id) ? resolved.case.id : '',
                          caseNumber: (resolved.case && resolved.case.caseNumber) ? resolved.case.caseNumber : 'UNKNOWN-CASE',
                        },
                        collectedBy: {
                          id: (resolved.collectedBy && resolved.collectedBy.id) || '',
                          name: (resolved.collectedBy && resolved.collectedBy.name) ? resolved.collectedBy.name : "Unknown",
                          badgeNumber: (resolved.collectedBy && resolved.collectedBy.badgeNumber) ? resolved.collectedBy.badgeNumber : "N/A",
                        },
                        custodyLogs: Array.isArray(resolved.custodyLogs) ? resolved.custodyLogs.map((log: any) => ({
                          id: log.id,
                          action: typeof log.action === 'object' ? (Object.keys(log.action)[0] || 'UNKNOWN') : String(log.action || 'UNKNOWN'),
                          timestamp: typeof log.timestamp === 'bigint' ? new Date(Number(log.timestamp)).toISOString() : (log.timestamp || new Date().toISOString()),
                          notes: log.notes ?? null,
                          fromUser: { name: log.fromUser?.name || 'Unknown', badgeNumber: log.fromUser?.badgeNumber || 'N/A' },
                          toUser: log.toUser ? { name: log.toUser?.name || 'Unknown', badgeNumber: log.toUser?.badgeNumber || 'N/A' } : null,
                        })) : [],
                      }
                      allEvidence.push(evidenceItem)
                    }
                  } else {
                    const resolved = (evidenceDetails || fromLocalAll) as any
                    if (resolved) {
                      const evidenceItem: EvidenceItem = {
                        id: resolved.id,
                        itemNumber: resolved.itemNumber,
                        evidenceType: typeof resolved.evidenceType === 'object' ? (Object.keys(resolved.evidenceType)[0] || 'OTHER') : String(resolved.evidenceType || 'OTHER'),
                        description: resolved.description,
                        collectedAt: typeof resolved.collectedAt === 'bigint' ? new Date(Number(resolved.collectedAt)).toISOString() : (resolved.collectedAt as any),
                        location: resolved.location,
                        initialHash: resolved.initialHash,
                        storyProtocolIpId: resolved.storyProtocolIpId,
                        icpCanisterId: resolved.icpCanisterId,
                        case: {
                          id: (resolved.case && resolved.case.id) ? resolved.case.id : '',
                          caseNumber: (resolved.case && resolved.case.caseNumber) ? resolved.case.caseNumber : 'UNKNOWN-CASE',
                        },
                        collectedBy: {
                          id: (resolved.collectedBy && resolved.collectedBy.id) || '',
                          name: (resolved.collectedBy && resolved.collectedBy.name) ? resolved.collectedBy.name : "Unknown",
                          badgeNumber: (resolved.collectedBy && resolved.collectedBy.badgeNumber) ? resolved.collectedBy.badgeNumber : "N/A",
                        },
                        custodyLogs: Array.isArray(resolved.custodyLogs) ? resolved.custodyLogs.map((log: any) => ({
                          id: log.id,
                          action: typeof log.action === 'object' ? (Object.keys(log.action)[0] || 'UNKNOWN') : String(log.action || 'UNKNOWN'),
                          timestamp: typeof log.timestamp === 'bigint' ? new Date(Number(log.timestamp)).toISOString() : (log.timestamp || new Date().toISOString()),
                          notes: log.notes ?? null,
                          fromUser: { name: log.fromUser?.name || 'Unknown', badgeNumber: log.fromUser?.badgeNumber || 'N/A' },
                          toUser: log.toUser ? { name: log.toUser?.name || 'Unknown', badgeNumber: log.toUser?.badgeNumber || 'N/A' } : null,
                        })) : [],
                      }
                      allEvidence.push(evidenceItem)
                    }
                  }
                } catch {}
              }
            }
          }
        } catch {}
      }

      // After collecting from canister per-case, also merge in any local/mock evidence (no dedupe: show all)
      try {
        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem('lv_mock_evidence')
          if (raw) {
            const list = JSON.parse(raw) as any[]
            for (const found of list) {
              if (!found) continue
              const candidateId = String(found.id || `CASE-${found?.case?.id}-${found?.itemNumber}`)
              const item: EvidenceItem = {
                id: candidateId,
                itemNumber: String(found.itemNumber || ''),
                evidenceType: String(found.evidenceType || 'OTHER'),
                description: String(found.description || ''),
                collectedAt: found.collectedAt || new Date().toISOString(),
                location: String(found.location || ''),
                initialHash: String(found.initialHash || ''),
                storyProtocolIpId: String(found.storyProtocolIpId || ''),
                icpCanisterId: String(found.icpCanisterId || ''),
                case: {
                  id: String(found?.case?.id || ''),
                  caseNumber: String(found?.case?.caseNumber || 'UNKNOWN-CASE'),
                },
                collectedBy: {
                  id: String(found?.collectedBy?.id || ''),
                  name: String(found?.collectedBy?.name || 'Unknown'),
                  badgeNumber: String(found?.collectedBy?.badgeNumber || 'N/A'),
                },
                custodyLogs: Array.isArray(found.custodyLogs) ? found.custodyLogs.map((log: any) => ({
                  id: String(log.id || ''),
                  action: String(log.action || 'UNKNOWN'),
                  timestamp: log.timestamp || new Date().toISOString(),
                  notes: log.notes ?? null,
                  fromUser: { name: String(log?.fromUser?.name || 'Unknown'), badgeNumber: String(log?.fromUser?.badgeNumber || 'N/A') },
                  toUser: log?.toUser ? { name: String(log?.toUser?.name || 'Unknown'), badgeNumber: String(log?.toUser?.badgeNumber || 'N/A') } : null,
                })) : [],
              }
              allEvidence.push(item)
            }
          }
        }
      } catch {}

      setEvidenceItems(allEvidence)
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
                      key={`${item.case.caseNumber}-${item.itemNumber}-${item.id}`}
                      className="p-4 hover:bg-input/50 transition-colors border-border/50"
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCaseNumber(item.case.caseNumber)
                              setShowCaseDialog(true)
                            }}
                            className="gap-2"
                          >
                            <ArrowRight className="h-4 w-4" />
                            Details
                          </Button>
                          {hasPermission("transfer_custody") && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setPrefillEvidenceId(item.id)
                                setActiveTab("transfer")
                              }}
                            >
                              Transfer Custody
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No evidence items found matching your search" : "No evidence items found. Create a case and log evidence to get started."}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEvidence && (
            <ChainOfCustodyView evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
          )}

          <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Evidence for Case {selectedCaseNumber}</DialogTitle>
                <DialogDescription>Select an item to view its chain of custody</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {evidenceItems.filter(e => e.case.caseNumber === selectedCaseNumber).map((ev) => (
                  <Card key={`${ev.case.caseNumber}-${ev.itemNumber}-${ev.id}`} className="p-4 flex items-center justify-between border-border/50">
                    <div>
                      <p className="font-semibold text-foreground">Item #{ev.itemNumber}</p>
                      <p className="text-sm text-muted-foreground">{ev.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Type: {ev.evidenceType} | Collected: {new Date(ev.collectedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setSelectedEvidence(ev)
                          setShowCaseDialog(false)
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                        View Chain
                      </Button>
                      {hasPermission("transfer_custody") && (
                        <Button
                          onClick={() => {
                            setShowCaseDialog(false)
                            setPrefillEvidenceId(ev.id)
                            setActiveTab("transfer")
                          }}
                        >
                          Transfer Custody
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {evidenceItems.filter(e => e.case.caseNumber === selectedCaseNumber).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No evidence found for this case.</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {hasPermission("transfer_custody") && (
          <TabsContent value="transfer">
            <TransferCustodyForm evidence={filteredEvidence} initialEvidenceId={prefillEvidenceId || undefined} />
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
