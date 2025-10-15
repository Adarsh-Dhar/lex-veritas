"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Download } from "lucide-react"

interface CaseData {
  caseNumber: string
  title: string
  status: "active" | "closed" | "archived"
  investigator: string
  createdDate: string
  evidenceCount: number
  lastUpdated: string
}

interface CaseDetailViewProps {
  caseData: CaseData
  onBack: () => void
}

// Mock evidence for a case
const mockCaseEvidence = [
  {
    id: "1",
    itemNumber: "001",
    description: "Samsung 700z laptop seized from suspect's desk",
    type: "Laptop Hard Drive",
    recordedDate: "Oct 15, 2025",
    status: "In Analysis",
  },
  {
    id: "2",
    itemNumber: "002",
    description: "iPhone 14 Pro recovered from scene",
    type: "Mobile Phone",
    recordedDate: "Oct 15, 2025",
    status: "Transferred",
  },
]

export default function CaseDetailView({ caseData, onBack }: CaseDetailViewProps) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Cases
      </Button>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">{caseData.caseNumber}</h1>
          <Badge
            className={caseData.status === "active" ? "bg-accent/20 text-accent" : "bg-muted/20 text-muted-foreground"}
          >
            {caseData.status}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">{caseData.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Investigator</p>
            <p className="font-semibold text-foreground">{caseData.investigator}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Created</p>
            <p className="font-semibold text-foreground">{caseData.createdDate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Evidence Items</p>
            <p className="font-semibold text-accent text-lg">{caseData.evidenceCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
            <p className="font-semibold text-foreground">{caseData.lastUpdated}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence Items in This Case</CardTitle>
          <CardDescription>All forensic evidence associated with {caseData.caseNumber}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockCaseEvidence.map((item) => (
              <Card key={item.id} className="p-4 border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">Item #{item.itemNumber}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Type: {item.type}</span>
                      <span>Recorded: {item.recordedDate}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FileText className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>Create court-admissible reports for this case</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Full Case Report
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Chain of Custody Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
