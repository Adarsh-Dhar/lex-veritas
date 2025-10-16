"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Loader2 } from "lucide-react"
import FileUploadArea from "./file-upload-area"
import { useAuth } from "@/lib/auth-context"
import { EvidenceTypeEnum, logEvidence, listCases, isMockEvidence, getContractConfig, registerUser, RoleEnum } from "@/lib/contract"

interface IntakeFormProps {
  onSubmit: (data: any) => void
}

interface Case {
  id: string
  caseNumber: string
  leadInvestigator: {
    id: string
    name: string
    badgeNumber: string
  }
}

export default function IntakeForm({ onSubmit }: IntakeFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    caseId: "",
    itemNumber: "",
    evidenceType: "",
    description: "",
    location: "",
    reasonForCollection: "",
    handlingNotes: "",
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [evidenceData, setEvidenceData] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoadingCases(true)
        const results = await listCases()
        if (!mounted) return
        // Map to local Case shape minimally
        setCases(
          results.map((c) => ({
            id: c.id,
            caseNumber: c.caseNumber,
            leadInvestigator: { id: "", name: "", badgeNumber: "" },
          })),
        )
      } catch {
        if (!mounted) return
        setCases([])
      } finally {
        if (!mounted) return
        setIsLoadingCases(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Cases listing removed (no REST/DB). Optional: pull from canister if supported.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, evidenceType: value }))
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
  }

  const handleSubmit = async () => {
    if (!uploadedFile || !user) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // In on-chain flow, compute or receive initial hash and store references via canister.
      // Placeholder for file processing (hashing/upload handled off-chain or by separate flow)
      const initialHash = "" // compute client-side if needed
      const storyProtocolIpId = ""
      const icpCanisterId = ""

      const typeVariant = (EvidenceTypeEnum as any)[formData.evidenceType] ?? EvidenceTypeEnum.OTHER
      const attemptLog = async () =>
        await logEvidence({
          caseId: formData.caseId,
          itemNumber: formData.itemNumber,
          evidenceType: typeVariant,
          description: formData.description,
          location: formData.location,
          initialHash,
          storyProtocolIpId,
          icpCanisterId,
        })

      let res = await attemptLog()

      if ('err' in res && typeof res.err === 'string' && res.err.toLowerCase().includes('user not registered')) {
        try {
          const desiredRole = (typeof window !== 'undefined' ? localStorage.getItem('lv_role_override') : null) || 'ANALYST'
          const roleVariant = (RoleEnum as any)[desiredRole] || RoleEnum.ANALYST
          await registerUser({
            name: user?.name || '',
            email: user?.email || '',
            badgeNumber: user?.badgeNumber || '',
            role: roleVariant,
          })
          res = await attemptLog()
        } catch {}
      }

      if ('err' in res) throw new Error(res.err)

      // If returned evidence looks like a dev mock, do not show success UI
      if (isMockEvidence(res.ok)) {
        throw new Error("Canister not deployed: evidence not recorded on-chain")
      }

      const evidenceRecord = {
        ...formData,
        fileName: uploadedFile.name,
        fileSize: (uploadedFile.size / 1024 / 1024).toFixed(2),
        timestamp: new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }),
        location: formData.location,
        hash: res.ok.initialHash,
        ipaRecord: res.ok.storyProtocolIpId,
        canisterId: res.ok.icpCanisterId,
      }

      // Persist locally so the dashboard can read (also useful in real flow as cache)
      try {
        if (typeof window !== 'undefined') {
          const selectedCase = cases.find(c => c.id === formData.caseId)
          const storedRaw = window.localStorage.getItem('lv_mock_evidence')
          const stored: any[] = storedRaw ? JSON.parse(storedRaw) : []
          const compositeId = `CASE-${formData.caseId}-${formData.itemNumber}`
          const backendId = (res as any).ok?.id
          const toStore = {
            id: compositeId,
            itemNumber: formData.itemNumber,
            evidenceType: formData.evidenceType || 'OTHER',
            description: formData.description,
            collectedAt: new Date().toISOString(),
            location: formData.location,
            initialHash: evidenceRecord.hash,
            storyProtocolIpId: evidenceRecord.ipaRecord,
            icpCanisterId: evidenceRecord.canisterId,
            case: {
              id: formData.caseId,
              caseNumber: selectedCase?.caseNumber || formData.caseId,
            },
            collectedBy: {
              id: user?.id || '',
              name: user?.name || 'Unknown',
              badgeNumber: user?.badgeNumber || 'N/A',
            },
            custodyLogs: [],
          }
          const dedup = [...stored.filter(e => e.id !== toStore.id), toStore]
          window.localStorage.setItem('lv_mock_evidence', JSON.stringify(dedup))

          // Maintain quick index per case
          const mapRaw = window.localStorage.getItem('lv_case_evidence_ids')
          const map: Record<string, string[]> = mapRaw ? JSON.parse(mapRaw) : {}
          const shortId = `${selectedCase?.caseNumber || formData.caseId}-${formData.itemNumber}`
          const arr = new Set([...(map[formData.caseId] || []), toStore.id, backendId, shortId].filter(Boolean) as string[])
          map[formData.caseId] = Array.from(arr)
          window.localStorage.setItem('lv_case_evidence_ids', JSON.stringify(map))
        }
      } catch {}

      setEvidenceData(evidenceRecord)
      setSuccess(`Evidence item ${formData.itemNumber} recorded successfully!`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Provide a helpful hint when canister is not deployed (dev flow)
      const cfg = getContractConfig()
      const isNoWasm = message.includes('IC0537') || message.toLowerCase().includes('not deployed') || message.toLowerCase().includes('no wasm')
      const hint = isNoWasm
        ? `Canister not deployed; evidence was not recorded on-chain.\nCanister: ${cfg.canisterId ?? '<missing>'}\nHost: ${cfg.host}\nIn dev, run: dfx start (in one terminal) and dfx deploy (in another), then restart the app.`
        : message
      console.error('Error creating evidence item:', err)
      setError(hint)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProceedToLifecycle = () => {
    if (evidenceData) {
      onSubmit(evidenceData)
    }
  }

  const handleResetForm = () => {
    setFormData({
      caseId: "",
      itemNumber: "",
      evidenceType: "",
      description: "",
      location: "",
      reasonForCollection: "",
      handlingNotes: "",
    })
    setUploadedFile(null)
    setError(null)
    setSuccess(null)
    setEvidenceData(null)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column */}
      <Card className="border border-border bg-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Case & Evidence Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Case</label>
            <Select value={formData.caseId} onValueChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder={isLoadingCases ? "Loading cases..." : "Select a case"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {isLoadingCases ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading cases...</div>
                ) : Array.isArray(cases) && cases.length > 0 ? (
                  cases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.caseNumber} - {caseItem.leadInvestigator.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No cases available</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Evidence Item #</label>
            <Input
              name="itemNumber"
              placeholder="e.g., 001"
              value={formData.itemNumber}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Evidence Type</label>
            <Select value={formData.evidenceType} onValueChange={handleSelectChange}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select evidence type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="LAPTOP_HARD_DRIVE">Laptop Hard Drive</SelectItem>
                <SelectItem value="MOBILE_PHONE">Mobile Phone</SelectItem>
                <SelectItem value="USB_DRIVE">USB Drive</SelectItem>
                <SelectItem value="SURVEILLANCE_FOOTAGE">Surveillance Footage</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              name="description"
              placeholder="e.g., Samsung 700z laptop seized from suspect's desk."
              value={formData.description}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Location</label>
            <Input
              name="location"
              placeholder="e.g., 37.7749° N, 122.4194° W"
              value={formData.location}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Reason for Collection</label>
            <Textarea
              name="reasonForCollection"
              placeholder="e.g., Digital forensics investigation"
              value={formData.reasonForCollection}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Handling Notes</label>
            <Textarea
              name="handlingNotes"
              placeholder="e.g., Handled with proper chain of custody"
              value={formData.handlingNotes}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-20"
            />
          </div>

          {/* Read-only fields */}
          <div className="mt-6 space-y-3 border-t border-border pt-6">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Timestamp:</span>
              <span className="text-foreground">Oct 15, 2025, 10:30:15 AM UTC</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="text-foreground">37.7749° N, 122.4194° W</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Right Column */}
      <Card className="border border-border bg-card p-6 flex flex-col">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Record Forensic Image</h2>

        <FileUploadArea onFileUpload={handleFileUpload} />

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={handleProceedToLifecycle}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                View in Evidence Lifecycle
              </Button>
              <Button
                onClick={handleResetForm}
                size="sm"
                variant="outline"
                className="border-border text-foreground hover:bg-input"
              >
                Log Another Item
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!uploadedFile || !formData.caseId || !formData.itemNumber || !formData.evidenceType || !formData.description || isLoading || !!success}
          className="mt-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : success ? (
            "Evidence Recorded Successfully"
          ) : (
            "Calculate Hash & Record Evidence"
          )}
        </Button>
      </Card>
    </div>
  )
}
