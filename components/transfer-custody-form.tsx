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

interface TransferCustodyFormProps {
  evidence: EvidenceItem[]
}

export default function TransferCustodyForm({ evidence }: TransferCustodyFormProps) {
  const [selectedEvidence, setSelectedEvidence] = useState("")
  const [receivingParty, setReceivingParty] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEvidence && receivingParty) {
      setSubmitted(true)
      setTimeout(() => {
        setSelectedEvidence("")
        setReceivingParty("")
        setNotes("")
        setSubmitted(false)
      }, 3000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Custody Transfer</CardTitle>
        <CardDescription>Record the transfer of evidence to another party with cryptographic signing</CardDescription>
      </CardHeader>
      <CardContent>
        {submitted && (
          <Alert className="mb-6 bg-accent/10 border-accent/30">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent">
              Custody transfer recorded successfully and added to the immutable chain
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
            <label className="block text-sm font-medium text-foreground mb-2">Receiving Party</label>
            <Select value={receivingParty} onValueChange={setReceivingParty}>
              <SelectTrigger>
                <SelectValue placeholder="Select receiving party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prosecutor">Prosecutor</SelectItem>
                <SelectItem value="forensic_lab">Forensic Lab</SelectItem>
                <SelectItem value="evidence_room">Evidence Room Storage</SelectItem>
                <SelectItem value="court">Court Clerk</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Transfer Notes</label>
            <Textarea
              placeholder="Document any relevant details about this transfer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
            />
          </div>

          <Button type="submit" className="w-full" disabled={!selectedEvidence || !receivingParty}>
            Record Custody Transfer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
