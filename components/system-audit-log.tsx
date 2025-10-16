"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, FileText, RefreshCw } from "lucide-react"

interface AuditEntry {
  id: string
  action: string
  actor: string
  timestamp: string
  details: string
  type: "evidence" | "user" | "system"
}


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
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch audit logs from API
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      // Note: This would need to be implemented in the API
      // For now, we'll show an empty state
      setAuditLogs([])
    } catch (err) {
      setError('Failed to fetch audit logs')
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Audit Log</CardTitle>
            <CardDescription>Complete record of all system activities and changes</CardDescription>
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="p-2 hover:bg-input/50 rounded-lg transition-colors"
            title="Refresh audit log"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4 text-destructive bg-destructive/10 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading audit logs...
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((entry) => (
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
