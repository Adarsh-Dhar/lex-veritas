"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

interface EvidenceItem {
  id: string
  itemNumber: string
  evidenceType: string
  description: string
  case: {
    id: string
    caseNumber: string
  }
}

interface LogActionFormProps {
  evidence: EvidenceItem[]
}

export default function LogActionForm({ evidence }: LogActionFormProps) {
  const [selectedEvidence, setSelectedEvidence] = useState("")
  const [actionType, setActionType] = useState("")
  const [details, setDetails] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEvidence && actionType) {
      setSubmitted(true)
      setTimeout(() => {
        setSelectedEvidence("")
        setActionType("")
        setDetails("")
        setSubmitted(false)
      }, 3000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Evidence Action</CardTitle>
        <CardDescription>Record any action taken on evidence (analysis, presentation, etc.)</CardDescription>
      </CardHeader>
      <CardContent>
        {submitted && (
          <Alert className="mb-6 bg-accent/10 border-accent/30">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent">
              Action logged successfully and recorded on the immutable ledger
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Select Evidence Item</label>
            <Select value={selectedEvidence} onValueChange={setSelectedEvidence}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an evidence item" />
              </SelectTrigger>
              <SelectContent>
                {evidence.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.case.caseNumber} - Item #{item.itemNumber}: {item.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Action Type</label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANALYSIS">Analysis</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="STORAGE">Storage</SelectItem>
                <SelectItem value="COURT">Court Presentation</SelectItem>
                <SelectItem value="DESTRUCTION">Destruction</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Action Details</label>
            <Textarea
              placeholder="Describe the action taken and any relevant findings..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-24"
            />
          </div>

          <Button type="submit" className="w-full" disabled={!selectedEvidence || !actionType}>
            Log Action
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
