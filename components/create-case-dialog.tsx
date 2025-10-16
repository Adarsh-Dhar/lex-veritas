"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"

interface User {
  id: string
  name: string
  badgeNumber: string
}

interface CreateCaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCaseCreated: (caseData: any) => void
}

export default function CreateCaseDialog({ open, onOpenChange, onCaseCreated }: CreateCaseDialogProps) {
  const [formData, setFormData] = useState({
    caseNumber: "",
    leadInvestigatorId: ""
  })
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch users for lead investigator dropdown
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      setError(null)
      const response = await fetch('/api/users/for-case-creation', {
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
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.caseNumber || !formData.leadInvestigatorId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create case')
      }

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          onCaseCreated(data.data)
          handleClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Error creating case:', err)
      setError(err instanceof Error ? err.message : 'Failed to create case')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ caseNumber: "", leadInvestigatorId: "" })
    setError(null)
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Start a new investigation case and assign a lead investigator
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Case Created Successfully!</h3>
            <p className="text-muted-foreground mb-4">
              Case {formData.caseNumber} has been created and is ready for evidence intake.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Case Number</label>
              <Input
                placeholder="e.g., SF-2025-001"
                value={formData.caseNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, caseNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Lead Investigator</label>
              <Select 
                value={formData.leadInvestigatorId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, leadInvestigatorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsers ? "Loading investigators..." : "Select lead investigator"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading investigators...</div>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.badgeNumber})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No investigators available</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.caseNumber || !formData.leadInvestigatorId || isLoading} 
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Case"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
