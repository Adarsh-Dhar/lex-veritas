"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Eye, CheckCircle2 } from "lucide-react"
import { generatePDFContent, downloadReport, type EvidenceData } from "@/lib/pdf-generator"

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

interface ReportGeneratorProps {
  evidence: EvidenceItem
  onClose: () => void
}

// Convert API evidence data to PDF generator format
const convertToPDFFormat = (evidence: EvidenceItem): EvidenceData => {
  return {
    caseNumber: evidence.case.caseNumber,
    itemNumber: evidence.itemNumber,
    description: evidence.description,
    type: evidence.evidenceType,
    recordedBy: evidence.collectedBy.name,
    recordedDate: new Date(evidence.collectedAt).toLocaleString(),
    hash: evidence.initialHash,
    ipaRecord: evidence.storyProtocolIpId,
    canisterId: evidence.icpCanisterId,
    chainOfCustody: evidence.custodyLogs.map(log => ({
      action: log.action,
      actor: log.toUser 
        ? `${log.fromUser.name} → ${log.toUser.name}` 
        : log.fromUser.name,
      timestamp: new Date(log.timestamp).toLocaleString(),
      details: log.notes || 'No additional details',
      status: 'completed'
    }))
  }
}

export default function ReportGenerator({ evidence, onClose }: ReportGeneratorProps) {
  const [reportGenerated, setReportGenerated] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const pdfData = convertToPDFFormat(evidence)

  const handleGenerateReport = () => {
    const content = generatePDFContent(pdfData)
    downloadReport(content, evidence.case.caseNumber, evidence.itemNumber)
    setReportGenerated(true)
  }

  const handlePreview = () => {
    setPreviewOpen(!previewOpen)
  }

  const reportContent = generatePDFContent(pdfData)

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Generate Chain of Custody Report</CardTitle>
            <CardDescription>
              Create a court-admissible PDF report for {evidence.case.caseNumber} - Item #{evidence.itemNumber}
            </CardDescription>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reportGenerated && (
          <Alert className="bg-accent/10 border-accent/30">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent">
              Report generated successfully and downloaded to your device
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-input/30 p-4 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-foreground">Report Details</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Case Number</p>
              <p className="font-medium text-foreground">{evidence.case.caseNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Item Number</p>
              <p className="font-medium text-foreground">{evidence.itemNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Evidence Type</p>
              <p className="font-medium text-foreground">{evidence.evidenceType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Chain Entries</p>
              <p className="font-medium text-foreground">{evidence.custodyLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleGenerateReport} className="gap-2 flex-1">
            <Download className="h-4 w-4" />
            Download Report
          </Button>
          <Button onClick={handlePreview} variant="outline" className="gap-2 bg-transparent">
            <Eye className="h-4 w-4" />
            {previewOpen ? "Hide" : "Preview"}
          </Button>
        </div>

        {previewOpen && (
          <div className="mt-4 p-4 bg-input/20 rounded-lg border border-border/50 max-h-96 overflow-y-auto">
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
              {reportContent}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
