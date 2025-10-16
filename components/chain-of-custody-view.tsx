"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowDown, Clock, User } from "lucide-react"

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

interface ChainOfCustodyViewProps {
  evidence: EvidenceItem
  onClose: () => void
}

export default function ChainOfCustodyView({ evidence, onClose }: ChainOfCustodyViewProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>
              Chain of Custody - {evidence.case.caseNumber} Item #{evidence.itemNumber}
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
            <p className="font-semibold text-foreground">{evidence.evidenceType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">SHA-256 Hash</p>
            <p className="font-mono text-sm text-foreground">{evidence.initialHash}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Story Protocol Record</p>
            <p className="font-mono text-sm text-foreground">{evidence.storyProtocolIpId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Initial Recording</p>
            <p className="text-sm text-foreground">{new Date(evidence.collectedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Unbreakable Chain of Custody</h3>
          <div className="space-y-4">
            {evidence.custodyLogs.length > 0 ? (
              evidence.custodyLogs.map((entry, index) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-6 w-6 text-accent mb-2" />
                    {index < evidence.custodyLogs.length - 1 && <ArrowDown className="h-4 w-4 text-border flex-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{entry.action}</h4>
                      <Badge variant="outline" className="text-xs">
                        completed
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="h-4 w-4" />
                      <span>{entry.fromUser.name} ({entry.fromUser.badgeNumber})</span>
                      {entry.toUser && (
                        <>
                          <span>→</span>
                          <span>{entry.toUser.name} ({entry.toUser.badgeNumber})</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-foreground bg-input/30 p-2 rounded">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No custody logs found for this evidence item
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
