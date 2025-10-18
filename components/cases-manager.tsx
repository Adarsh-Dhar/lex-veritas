"use client"

import React, { useEffect, useState, type ReactElement } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createCase, getCaseEvidence, getContractConfig, logEvidence, logEvidenceAuthenticated, EvidenceTypeEnum, getEvidenceHistory, updateUserRoleAuthenticated, RoleEnum } from "@/lib/contract"
import { computeTextHash } from "@/lib/file-hash"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import TransferCustodyForm from "@/components/transfer-custody-form"
import { AuthClient } from "@dfinity/auth-client"

type CaseSummary = {
  id: string
  caseNumber: string
}

export default function CasesManager(): ReactElement {
  const { toast } = useToast()
  const { user } = useAuth()
  const [creating, setCreating] = useState(false)
  const [caseNumber, setCaseNumber] = useState("")
  const [lookupCaseId, setLookupCaseId] = useState("")
  const [evidenceIds, setEvidenceIds] = useState<string[] | null>(null)
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [details, setDetails] = useState<any | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

  // Add Evidence form state
  const [selectedCaseId, setSelectedCaseId] = useState("")
  const [itemNumber, setItemNumber] = useState("")
  const [evidenceTypeKey, setEvidenceTypeKey] = useState<string>("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [addingEvidence, setAddingEvidence] = useState(false)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('lv_known_cases') : null
      if (raw) {
        const parsed = JSON.parse(raw) as CaseSummary[]
        setCases(parsed)
      }
    } catch {}
  }, [])

  function saveCases(next: CaseSummary[]) {
    setCases(next)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('lv_known_cases', JSON.stringify(next))
      }
    } catch {}
  }

  async function handleCreateCase(e: React.FormEvent) {
    e.preventDefault()
    if (!caseNumber.trim()) {
      toast({ title: "Case number required", variant: "destructive" })
      return
    }
    try {
      setCreating(true)
      // Log start of creation attempt
      console.log("[CasesManager] Creating case…", { caseNumber: caseNumber.trim() })
      const res = await createCase(caseNumber.trim())
      if ("ok" in res) {
        toast({ title: "Case created", description: `Case ${res.ok.caseNumber} created successfully` })
        console.log("[CasesManager] Create case success", res.ok)
        setCaseNumber("")
        const created = { id: res.ok.id, caseNumber: res.ok.caseNumber }
        const exists = cases.some(c => c.id === created.id)
        const next = exists ? cases : [created, ...cases]
        saveCases(next)
      } else {
        toast({ title: "Failed to create case", description: res.err, variant: "destructive" })
        console.error("[CasesManager] Create case failed", res.err)
      }
    } catch (err: any) {
      const message = String(err?.message || err)
      const cfg = getContractConfig()
      const isNoWasm = message.includes("IC0537") || message.toLowerCase().includes("no wasm module")
      const hint = isNoWasm
        ? `Requested canister has no wasm module. Ensure your canister is deployed.\nCanister: ${cfg.canisterId ?? '<missing>'}\nHost: ${cfg.host}\nFix: In dev, run 'dfx start' then 'dfx deploy'. Then set NEXT_PUBLIC_CONTRACT_BACKEND_CANISTER_ID and restart the app.`
        : message
      toast({ title: "Error creating case", description: hint, variant: "destructive" })
      console.error("[CasesManager] Create case error", err, { config: cfg })
    } finally {
      setCreating(false)
    }
  }

  async function handleLookupEvidence(e: React.FormEvent) {
    e.preventDefault()
    if (!lookupCaseId.trim()) {
      toast({ title: "Case ID required", variant: "destructive" })
      return
    }
    try {
      setLoadingEvidence(true)
      const ids = await getCaseEvidence(lookupCaseId.trim())
      setEvidenceIds(ids)
      if (!ids || ids.length === 0) {
        toast({ title: "No evidence found", description: "This case has no evidence yet" })
      }
    } catch (err: any) {
      toast({ title: "Error fetching evidence", description: String(err?.message || err), variant: "destructive" })
    } finally {
      setLoadingEvidence(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a new case</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreateCase}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                placeholder="e.g. LV-2025-0001"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Case"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cases</CardTitle>
            <span className="text-xs text-muted-foreground">{cases.length} total</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lookup">Lookup Evidence by Case ID</Label>
            <form onSubmit={handleLookupEvidence} className="flex gap-2">
              <Input
                id="lookup"
                placeholder="Enter case ID (case number)"
                value={lookupCaseId}
                onChange={(e) => setLookupCaseId(e.target.value)}
              />
              <Button type="submit" disabled={loadingEvidence} variant="secondary">
                {loadingEvidence ? "Loading..." : "Get Evidence"}
              </Button>
            </form>
          </div>

          <div>
            <Label>Known Cases</Label>
            {cases.length === 0 ? (
              <div className="text-sm text-muted-foreground mt-2">No cases yet. Create one to get started.</div>
            ) : (
              <ul className="mt-2 rounded-md border border-border divide-y divide-border">
                {cases.map((c) => (
                  <li key={c.id} className="p-3 text-sm flex items-center justify-between">
                    <span className="font-medium">{c.caseNumber}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        setLookupCaseId(c.id)
                        try {
                          setLoadingEvidence(true)
                          const ids = await getCaseEvidence(c.id)
                          setEvidenceIds(ids)
                        } finally {
                          setLoadingEvidence(false)
                        }
                      }}
                    >
                      View Evidence
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {evidenceIds && (
            <div>
              <Label>Evidence IDs</Label>
              <ul className="mt-2 rounded-md border border-border divide-y divide-border">
                {evidenceIds.map((id, idx) => (
                  <li key={`${lookupCaseId}-${id}-${idx}`} className="p-3 text-sm flex items-center justify-between gap-3">
                    <span className="truncate">{id}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        setDetailsId(id)
                        setDetailsOpen(true)
                        setDetailsLoading(true)
                        setDetailsError(null)
                        setDetails(null)
                        try {
                          const data = await getEvidenceHistory(id)
                          if (!data) {
                            setDetailsError("No details found for this evidence ID")
                          } else {
                            setDetails(data)
                          }
                        } catch (err: any) {
                          setDetailsError(String(err?.message || err))
                        } finally {
                          setDetailsLoading(false)
                        }
                      }}
                    >
                      Details
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Evidence to Case */}
      <Card>
        <CardHeader>
          <CardTitle>Add Evidence to Case</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Case</Label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger>
                <SelectValue placeholder={cases.length ? "Select a case" : "No cases available"} />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.caseNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemNumber">Item Number</Label>
            <Input id="itemNumber" placeholder="e.g. 001" value={itemNumber} onChange={(e) => setItemNumber(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Evidence Type</Label>
            <Select value={evidenceTypeKey} onValueChange={setEvidenceTypeKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(EvidenceTypeEnum).map((k) => (
                  <SelectItem key={k} value={k}>{k.replaceAll("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g. Evidence Locker A" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              alert('🔥 BUTTON CLICKED! Check console for details.')
              console.log('🔥🔥🔥 BUTTON CLICKED 🔥🔥🔥')
              if (!selectedCaseId || !itemNumber || !evidenceTypeKey || !description || !location) {
                toast({ title: "Missing fields", description: "Fill all fields to add evidence", variant: "destructive" })
                return
              }
              try {
                setAddingEvidence(true)
                // Compute hash from description and location for non-file evidence
                const contentToHash = `${description}-${location}-${itemNumber}`
                console.log('Content to hash:', contentToHash)
                const initialHash = await computeTextHash(contentToHash)
                console.log('Initial hash:', initialHash)
                console.log('🔥🔥🔥 CALLING LOG EVIDENCE AUTHENTICATED 🔥🔥🔥')
                console.log('Evidence parameters:', {
                  caseId: selectedCaseId,
                  itemNumber,
                  evidenceType: evidenceTypeKey,
                  description,
                  location,
                  initialHash
                })

                // Get the user's identity for authenticated evidence logging
                console.log('Getting user identity for evidence logging...')
                const authClient = await AuthClient.create()
                const isAuthenticated = await authClient.isAuthenticated()
                console.log('User authenticated:', isAuthenticated)

                if (!isAuthenticated) {
                  toast({ title: "Authentication Error", description: "User is not authenticated. Please log in again.", variant: "destructive" })
                  return
                }

                const identity = await authClient.getIdentity()
                console.log('Identity obtained:', !!identity, 'Principal:', identity?.getPrincipal()?.toText())

                // Ensure user has correct role in the contract
                console.log('🔐🔐🔐 UPDATING USER ROLE IN CONTRACT 🔐🔐🔐')
                try {
                  const updateResult = await updateUserRoleAuthenticated({
                    role: RoleEnum.ADMIN, // Force ADMIN role
                    identity,
                  })
                  console.log('User role update result:', updateResult)
                  if ('err' in updateResult) {
                    console.log('User role update error:', updateResult.err)
                  } else {
                    console.log('✅ User role updated successfully in contract')
                  }
                } catch (updateError) {
                  console.log('User role update failed:', updateError)
                }
                
                const res = await logEvidenceAuthenticated({
                  caseId: selectedCaseId,
                  itemNumber,
                  evidenceType: (EvidenceTypeEnum as any)[evidenceTypeKey],
                  description,
                  location,
                  initialHash,
                  identity,
                })
                
                console.log('🔥🔥🔥 LOG EVIDENCE AUTHENTICATED RESULT 🔥🔥🔥', res)
                if ("ok" in res) {
                  console.log('✅✅✅ EVIDENCE LOGGING SUCCESS ✅✅✅', res.ok)
                  toast({ title: "Evidence logged", description: `Item #${itemNumber} added to ${selectedCaseId}` })
                  // Persist locally (dev fallback) so dashboards can read
                  try {
                    if (typeof window !== 'undefined') {
                      const raw = window.localStorage.getItem('lv_mock_evidence')
                      const stored: any[] = raw ? JSON.parse(raw) : []
                      const selectedCase = cases.find(c => c.id === selectedCaseId)
                      const toStore = {
                        id: `CASE-${selectedCaseId}-${itemNumber}`,
                        itemNumber,
                        evidenceType: evidenceTypeKey,
                        description,
                        collectedAt: new Date().toISOString(),
                        location,
                        initialHash: res.ok.initialHash ?? initialHash,
                        storyProtocolIpId: res.ok.storyProtocolIpId ?? `manual-ipa-${Date.now()}`,
                        icpCanisterId: res.ok.icpCanisterId ?? "aaaaa-aa",
                        case: { id: selectedCaseId, caseNumber: selectedCase?.caseNumber || selectedCaseId },
                        collectedBy: { id: user?.id || '', name: user?.name || 'Unknown', badgeNumber: user?.badgeNumber || 'N/A' },
                        custodyLogs: Array.isArray((res.ok as any).custodyLogs) ? (res.ok as any).custodyLogs : [],
                      }
                      const dedup = [...stored.filter(e => e.id !== toStore.id), toStore]
                      window.localStorage.setItem('lv_mock_evidence', JSON.stringify(dedup))
                    }
                  } catch {}
                  // Reset form
                  setItemNumber("")
                  setEvidenceTypeKey("")
                  setDescription("")
                  setLocation("")
                } else {
                  console.log('❌❌❌ EVIDENCE LOGGING FAILED ❌❌❌', res.err)
                  toast({ title: "Failed to log evidence", description: res.err, variant: "destructive" })
                }
              } catch (err: any) {
                console.log('💥💥💥 EXCEPTION IN EVIDENCE CREATION 💥💥💥', err)
                toast({ title: "Error", description: String(err?.message || err), variant: "destructive" })
              } finally {
                console.log('🏁🏁🏁 EVIDENCE CREATION FINALLY BLOCK 🏁🏁🏁')
                setAddingEvidence(false)
              }
            }}
            disabled={addingEvidence}
          >
            {addingEvidence ? "Adding…" : "Add Evidence"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={(o) => { setDetailsOpen(o); if (!o) { setDetailsId(null); setDetails(null); setDetailsError(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Evidence Details</DialogTitle>
            <DialogDescription>View immutable evidence metadata and identifiers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {detailsLoading && (
              <div className="text-sm text-muted-foreground">Loading…</div>
            )}
            {detailsError && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{detailsError}</div>
            )}
            {!detailsLoading && !detailsError && details && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Evidence ID</div>
                    <div className="font-medium break-all">{details.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Case ID</div>
                    <div className="font-medium break-all">{details.caseId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Item Number</div>
                    <div className="font-medium">{details.itemNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="font-medium">{typeof details.evidenceType === 'object' ? Object.keys(details.evidenceType)[0] : String(details.evidenceType)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Description</div>
                    <div className="font-medium">{details.description}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Collected At</div>
                    <div className="font-medium">{typeof details.collectedAt === 'bigint' ? new Date(Number(details.collectedAt)).toLocaleString() : String(details.collectedAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="font-medium">{details.location}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Initial Hash</div>
                    <div className="font-medium break-all">{details.initialHash}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Story Protocol IP</div>
                    <div className="font-medium break-all">{details.storyProtocolIpId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">ICP Canister</div>
                    <div className="font-medium break-all">{details.icpCanisterId}</div>
                  </div>
                </div>
                <div className="pt-3">
                  <Button
                    className="w-full"
                    onClick={() => setTransferOpen(true)}
                  >
                    Transfer Custody
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Custody nested dialog */}
      <Dialog open={transferOpen} onOpenChange={(o) => setTransferOpen(o)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Log Custody Transfer</DialogTitle>
            <DialogDescription>Record the transfer for this evidence item.</DialogDescription>
          </DialogHeader>
          {details && (
            <TransferCustodyForm
              evidence={[{
                id: String(details.id || detailsId || ""),
                itemNumber: String(details.itemNumber || ""),
                evidenceType: typeof details.evidenceType === 'object' ? Object.keys(details.evidenceType)[0] : String(details.evidenceType || ""),
                description: String(details.description || ""),
                case: { id: String(details.caseId || ""), caseNumber: String(details.caseId || "") },
              }]}
              initialEvidenceId={String(details.id || detailsId || "")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


