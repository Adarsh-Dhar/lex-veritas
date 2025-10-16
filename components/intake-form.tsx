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
import { EvidenceTypeEnum, logEvidence } from "@/lib/contract"

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

  useEffect(() => {
    setIsLoadingCases(false)
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

    try {
      // In on-chain flow, compute or receive initial hash and store references via canister.
      // Placeholder for file processing (hashing/upload handled off-chain or by separate flow)
      const initialHash = "" // compute client-side if needed
      const storyProtocolIpId = ""
      const icpCanisterId = ""

      const typeVariant = (EvidenceTypeEnum as any)[formData.evidenceType] ?? EvidenceTypeEnum.OTHER
      const res = await logEvidence({
        caseId: formData.caseId,
        itemNumber: formData.itemNumber,
        evidenceType: typeVariant,
        description: formData.description,
        location: formData.location,
        initialHash,
        storyProtocolIpId,
        icpCanisterId,
      })

      if ('err' in res) throw new Error(res.err)

      onSubmit({
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
      })
    } catch (err) {
      console.error('Error creating evidence item:', err)
      setError(err instanceof Error ? err.message : 'Failed to create evidence item')
    } finally {
      setIsLoading(false)
    }
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

        <Button
          onClick={handleSubmit}
          disabled={!uploadedFile || !formData.caseId || !formData.itemNumber || !formData.evidenceType || !formData.description || isLoading}
          className="mt-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            "Calculate Hash & Record Evidence"
          )}
        </Button>
      </Card>
    </div>
  )
}
