"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin } from "lucide-react"
import FileUploadArea from "./file-upload-area"

interface IntakeFormProps {
  onSubmit: (data: any) => void
}

export default function IntakeForm({ onSubmit }: IntakeFormProps) {
  const [formData, setFormData] = useState({
    caseNumber: "",
    leadInvestigator: "Jane Doe",
    evidenceItem: "",
    evidenceType: "",
    description: "",
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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

  const handleSubmit = () => {
    if (!uploadedFile) return

    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    })

    onSubmit({
      ...formData,
      fileName: uploadedFile.name,
      fileSize: (uploadedFile.size / 1024 / 1024).toFixed(2),
      timestamp,
      location: "37.7749° N, 122.4194° W",
      hash: "0a4f...c3e1",
      ipaRecord: "0x1234...abcd",
      canisterId: "canister-id-xyz...",
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column */}
      <Card className="border border-border bg-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Case & Evidence Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Case Number</label>
            <Input
              name="caseNumber"
              placeholder="e.g., SF-2025-0087"
              value={formData.caseNumber}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Lead Investigator</label>
            <Input
              name="leadInvestigator"
              value={formData.leadInvestigator}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Evidence Item #</label>
            <Input
              name="evidenceItem"
              placeholder="e.g., 001"
              value={formData.evidenceItem}
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
                <SelectItem value="laptop">Laptop Hard Drive</SelectItem>
                <SelectItem value="phone">Mobile Phone</SelectItem>
                <SelectItem value="usb">USB Drive</SelectItem>
                <SelectItem value="footage">Surveillance Footage</SelectItem>
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

        <Button
          onClick={handleSubmit}
          disabled={!uploadedFile}
          className="mt-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
        >
          Calculate Hash & Record Evidence
        </Button>
      </Card>
    </div>
  )
}
