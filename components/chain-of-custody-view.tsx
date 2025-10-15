"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowDown, Clock, User } from "lucide-react"

interface EvidenceItem {
  id: string
  caseNumber: string
  itemNumber: string
  description: string
  type: string
  recordedBy: string
  timestamp: string
  hash: string
  ipaRecord: string
}

interface ChainOfCustodyViewProps {
  evidence: EvidenceItem
  onClose: () => void
}

// Mock chain of custody history
const mockChainHistory = [
  {
    id: "1",
    action: "Evidence Recorded",
    actor: "Detective Sarah Chen",
    timestamp: "Oct 15, 2025, 10:30:15 AM UTC",
    details: "Initial evidence intake and forensic imaging",
    status: "completed",
  },
  {
    id: "2",
    action: "Transferred to Forensic Lab",
    actor: "Detective Sarah Chen",
    timestamp: "Oct 15, 2025, 02:15:42 PM UTC",
    details: "Transferred custody to Dr. Michael Torres",
    status: "completed",
  },
  {
    id: "3",
    action: "Analysis Initiated",
    actor: "Dr. Michael Torres",
    timestamp: "Oct 16, 2025, 09:00:00 AM UTC",
    details: "Created working copy for forensic analysis",
    status: "completed",
  },
  {
    id: "4",
    action: "Analysis Complete",
    actor: "Dr. Michael Torres",
    timestamp: "Oct 17, 2025, 04:30:22 PM UTC",
    details: "Forensic analysis completed, findings documented",
    status: "completed",
  },
]

export default function ChainOfCustodyView({ evidence, onClose }: ChainOfCustodyViewProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>
              Chain of Custody - {evidence.caseNumber} Item #{evidence.itemNumber}
            </CardTitle>
            <CardDescription className="mt-2">{evidence.description}</CardDescription>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Evidence Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-input/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Evidence Type</p>
            <p className="font-semibold text-foreground">{evidence.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">SHA-256 Hash</p>
            <p className="font-mono text-sm text-foreground">{evidence.hash}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Story Protocol Record</p>
            <p className="font-mono text-sm text-foreground">{evidence.ipaRecord}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Initial Recording</p>
            <p className="text-sm text-foreground">{evidence.timestamp}</p>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Unbreakable Chain of Custody</h3>
          <div className="space-y-4">
            {mockChainHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-6 w-6 text-accent mb-2" />
                  {index < mockChainHistory.length - 1 && <ArrowDown className="h-4 w-4 text-border flex-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-foreground">{entry.action}</h4>
                    <Badge variant="outline" className="text-xs">
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    <span>{entry.actor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span>{entry.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground bg-input/30 p-2 rounded">{entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
