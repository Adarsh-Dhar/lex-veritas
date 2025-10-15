"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, FileText } from "lucide-react"

interface AuditEntry {
  id: string
  action: string
  actor: string
  timestamp: string
  details: string
  type: "evidence" | "user" | "system"
}

const mockAuditLog: AuditEntry[] = [
  {
    id: "1",
    action: "Evidence Recorded",
    actor: "Detective Sarah Chen",
    timestamp: "Oct 17, 2025, 02:30 PM",
    details: "Recorded evidence item SF-2025-0087-001",
    type: "evidence",
  },
  {
    id: "2",
    action: "User Created",
    actor: "System Administrator",
    timestamp: "Oct 17, 2025, 01:15 PM",
    details: "Created new user account: Dr. Michael Torres",
    type: "user",
  },
  {
    id: "3",
    action: "Custody Transfer",
    actor: "Detective Sarah Chen",
    timestamp: "Oct 17, 2025, 12:45 PM",
    details: "Transferred evidence to Prosecutor James Mitchell",
    type: "evidence",
  },
  {
    id: "4",
    action: "Report Generated",
    actor: "Prosecutor James Mitchell",
    timestamp: "Oct 17, 2025, 11:20 AM",
    details: "Generated chain of custody report for SF-2025-0087",
    type: "evidence",
  },
  {
    id: "5",
    action: "User Permissions Updated",
    actor: "System Administrator",
    timestamp: "Oct 16, 2025, 03:00 PM",
    details: "Updated permissions for Forensic Analyst role",
    type: "system",
  },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case "evidence":
      return "bg-primary/20 text-primary border-primary/30"
    case "user":
      return "bg-accent/20 text-accent border-accent/30"
    case "system":
      return "bg-secondary/20 text-secondary border-secondary/30"
    default:
      return ""
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "evidence":
      return <FileText className="h-4 w-4" />
    case "user":
      return <User className="h-4 w-4" />
    case "system":
      return <FileText className="h-4 w-4" />
    default:
      return null
  }
}

export default function SystemAuditLog() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Audit Log</CardTitle>
        <CardDescription>Complete record of all system activities and changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockAuditLog.map((entry) => (
            <div key={entry.id} className="p-4 bg-input/20 rounded-lg border border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>{getTypeIcon(entry.type)}</div>
                  <div>
                    <p className="font-semibold text-foreground">{entry.action}</p>
                    <p className="text-sm text-muted-foreground">{entry.details}</p>
                  </div>
                </div>
                <Badge className={getTypeColor(entry.type)}>{entry.type}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{entry.actor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
