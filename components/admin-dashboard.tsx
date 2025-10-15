"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit2, Trash2, Shield } from "lucide-react"
import UserManagementForm from "./user-management-form"
import PermissionManager from "./permission-manager"
import SystemAuditLog from "./system-audit-log"

interface User {
  id: string
  name: string
  email: string
  role: "forensic_analyst" | "prosecutor" | "administrator"
  badge_number?: string
  status: "active" | "inactive" | "suspended"
  lastLogin: string
  createdDate: string
}

// Mock user data
const mockUsers: User[] = [
  {
    id: "1",
    name: "Detective Sarah Chen",
    email: "analyst@lexveritas.gov",
    role: "forensic_analyst",
    badge_number: "SF-2847",
    status: "active",
    lastLogin: "Oct 17, 2025, 02:30 PM",
    createdDate: "Sep 15, 2025",
  },
  {
    id: "2",
    name: "Prosecutor James Mitchell",
    email: "prosecutor@lexveritas.gov",
    role: "prosecutor",
    status: "active",
    lastLogin: "Oct 16, 2025, 10:15 AM",
    createdDate: "Sep 10, 2025",
  },
  {
    id: "3",
    name: "System Administrator",
    email: "admin@lexveritas.gov",
    role: "administrator",
    status: "active",
    lastLogin: "Oct 17, 2025, 09:00 AM",
    createdDate: "Aug 01, 2025",
  },
  {
    id: "4",
    name: "Dr. Michael Torres",
    email: "torres@lexveritas.gov",
    role: "forensic_analyst",
    badge_number: "SF-2901",
    status: "active",
    lastLogin: "Oct 15, 2025, 04:45 PM",
    createdDate: "Sep 20, 2025",
  },
]

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [activeTab, setActiveTab] = useState("users")
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.badge_number?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent/20 text-accent border-accent/30"
      case "inactive":
        return "bg-muted/20 text-muted-foreground border-muted/30"
      case "suspended":
        return "bg-destructive/20 text-destructive border-destructive/30"
      default:
        return ""
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "forensic_analyst":
        return "bg-primary/20 text-primary border-primary/30"
      case "prosecutor":
        return "bg-secondary/20 text-secondary border-secondary/30"
      case "administrator":
        return "bg-accent/20 text-accent border-accent/30"
      default:
        return ""
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Administration Dashboard</h1>
        <p className="text-muted-foreground">Manage users, permissions, and system security</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Manage user accounts and access levels</CardDescription>
              </div>
              <Button onClick={() => setShowAddUserForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or badge number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="p-4 border-border/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{user.name}</h4>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mb-3 flex-wrap">
                            <Badge className={getRoleColor(user.role)}>{user.role.replace("_", " ")}</Badge>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>
                              <p className="mb-1">Badge Number</p>
                              <p className="font-medium text-foreground">{user.badge_number || "N/A"}</p>
                            </div>
                            <div>
                              <p className="mb-1">Last Login</p>
                              <p className="font-medium text-foreground">{user.lastLogin}</p>
                            </div>
                            <div>
                              <p className="mb-1">Created</p>
                              <p className="font-medium text-foreground">{user.createdDate}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            className="gap-2 bg-transparent"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="gap-2 bg-transparent text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No users found" : "No users in the system"}
                </div>
              )}
            </CardContent>
          </Card>

          {showAddUserForm && (
            <UserManagementForm onClose={() => setShowAddUserForm(false)} onSubmit={() => setShowAddUserForm(false)} />
          )}

          {selectedUser && (
            <UserManagementForm
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onSubmit={() => setSelectedUser(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionManager />
        </TabsContent>

        <TabsContent value="audit">
          <SystemAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  )
}
