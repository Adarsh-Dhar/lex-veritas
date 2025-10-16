"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit2, Trash2, Shield, Loader2 } from "lucide-react"
import UserManagementForm from "./user-management-form"
import PermissionManager from "./permission-manager"
import SystemAuditLog from "./system-audit-log"

interface User {
  id: string
  name: string
  email: string
  role: "ANALYST" | "PROSECUTOR" | "ADMIN" | "AUDITOR"
  badgeNumber?: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  createdAt: string
  updatedAt: string
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState("users")
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/users', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      if (data.success) {
        setUsers(data.data.users || [])
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.badgeNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-accent/20 text-accent border-accent/30"
      case "INACTIVE":
        return "bg-muted/20 text-muted-foreground border-muted/30"
      case "SUSPENDED":
        return "bg-destructive/20 text-destructive border-destructive/30"
      default:
        return ""
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ANALYST":
        return "bg-primary/20 text-primary border-primary/30"
      case "PROSECUTOR":
        return "bg-secondary/20 text-secondary border-secondary/30"
      case "ADMIN":
        return "bg-accent/20 text-accent border-accent/30"
      case "AUDITOR":
        return "bg-muted/20 text-muted-foreground border-muted/30"
      default:
        return ""
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      // Refresh the users list
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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

              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={fetchUsers} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : filteredUsers.length > 0 ? (
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
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>
                              <p className="mb-1">Badge Number</p>
                              <p className="font-medium text-foreground">{user.badgeNumber || "N/A"}</p>
                            </div>
                            <div>
                              <p className="mb-1">Last Updated</p>
                              <p className="font-medium text-foreground">{formatDate(user.updatedAt)}</p>
                            </div>
                            <div>
                              <p className="mb-1">Created</p>
                              <p className="font-medium text-foreground">{formatDate(user.createdAt)}</p>
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
