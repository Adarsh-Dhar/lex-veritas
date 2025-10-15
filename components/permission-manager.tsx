"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"

interface RolePermission {
  role: string
  permissions: {
    name: string
    description: string
    granted: boolean
  }[]
}

const rolePermissions: RolePermission[] = [
  {
    role: "Forensic Analyst",
    permissions: [
      { name: "Log Evidence", description: "Record new evidence items", granted: true },
      { name: "Transfer Custody", description: "Transfer evidence to another party", granted: true },
      { name: "Log Action", description: "Record actions on evidence", granted: true },
      { name: "View Evidence", description: "Search and view evidence details", granted: true },
      { name: "View Cases", description: "View case information", granted: true },
      { name: "Generate Reports", description: "Generate chain of custody reports", granted: false },
      { name: "Manage Users", description: "Create and manage user accounts", granted: false },
    ],
  },
  {
    role: "Prosecutor",
    permissions: [
      { name: "Log Evidence", description: "Record new evidence items", granted: false },
      { name: "Transfer Custody", description: "Transfer evidence to another party", granted: false },
      { name: "Log Action", description: "Record actions on evidence", granted: false },
      { name: "View Evidence", description: "Search and view evidence details", granted: true },
      { name: "View Cases", description: "View case information", granted: true },
      { name: "Generate Reports", description: "Generate chain of custody reports", granted: true },
      { name: "Manage Users", description: "Create and manage user accounts", granted: false },
    ],
  },
  {
    role: "Administrator",
    permissions: [
      { name: "Log Evidence", description: "Record new evidence items", granted: true },
      { name: "Transfer Custody", description: "Transfer evidence to another party", granted: true },
      { name: "Log Action", description: "Record actions on evidence", granted: true },
      { name: "View Evidence", description: "Search and view evidence details", granted: true },
      { name: "View Cases", description: "View case information", granted: true },
      { name: "Generate Reports", description: "Generate chain of custody reports", granted: true },
      { name: "Manage Users", description: "Create and manage user accounts", granted: true },
    ],
  },
]

export default function PermissionManager() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Access Control</CardTitle>
          <CardDescription>View and manage permissions for each user role</CardDescription>
        </CardHeader>
      </Card>

      {rolePermissions.map((roleGroup) => (
        <Card key={roleGroup.role} className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{roleGroup.role}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roleGroup.permissions.map((permission) => (
                <div key={permission.name} className="flex items-start gap-3 p-3 bg-input/20 rounded-lg">
                  <div className="mt-1">
                    {permission.granted ? (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{permission.name}</p>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                  <Badge
                    className={permission.granted ? "bg-accent/20 text-accent" : "bg-muted/20 text-muted-foreground"}
                  >
                    {permission.granted ? "Granted" : "Denied"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
