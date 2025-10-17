"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { transferCustody } from "@/lib/contract"

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
  initialEvidenceId?: string
}

export default function TransferCustodyForm({ evidence, initialEvidenceId }: TransferCustodyFormProps) {
  const [selectedEvidence, setSelectedEvidence] = useState("")
  const [receivingParty, setReceivingParty] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  // Preselect when provided by parent
  useEffect(() => {
    if (initialEvidenceId) {
      setSelectedEvidence(initialEvidenceId)
    }
  }, [initialEvidenceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvidence || !receivingParty) return

    setIsLoading(true)
    setError("")

    try {
      const res = await transferCustody({
        evidenceId: selectedEvidence,
        toUserId: receivingParty,
        notes: notes || `Transferred to ${receivingParty}`,
      })
      if ('err' in res) throw new Error(res.err)

      setSubmitted(true)
      setSelectedEvidence("")
      setReceivingParty("")
      setNotes("")
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (err) {
      console.error('Transfer custody error:', err)
      setError(err instanceof Error ? err.message : 'Failed to record custody transfer')
    } finally {
      setIsLoading(false)
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
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Custody transfer recorded successfully and added to the immutable chain
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
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
            <label className="block text-sm font-medium text-foreground mb-2">Receiving Principal ID</label>
            <Input
              placeholder="e.g. w7x7r-cok77-xa (Principal of recipient)"
              value={receivingParty}
              onChange={(e) => setReceivingParty(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter the Internet Computer Principal of the receiving party.
            </p>
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!selectedEvidence || !receivingParty || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording Transfer...
              </>
            ) : (
              'Record Custody Transfer'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
