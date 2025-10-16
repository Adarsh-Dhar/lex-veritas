"use client"

import React, { useEffect, useState, type ReactElement } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createCase, getCaseEvidence, getContractConfig } from "@/lib/contract"

type CaseSummary = {
  id: string
  caseNumber: string
}

export default function CasesManager(): ReactElement {
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [caseNumber, setCaseNumber] = useState("")
  const [lookupCaseId, setLookupCaseId] = useState("")
  const [evidenceIds, setEvidenceIds] = useState<string[] | null>(null)
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [cases, setCases] = useState<CaseSummary[]>([])

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
                {evidenceIds.map((id) => (
                  <li key={id} className="p-3 text-sm">
                    {id}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


