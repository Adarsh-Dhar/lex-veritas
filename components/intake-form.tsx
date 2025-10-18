"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Loader2 } from "lucide-react"
import FileUploadArea from "./file-upload-area"
import { useAuth } from "@/lib/auth-context"
import { EvidenceTypeEnum, logEvidence, logEvidenceAuthenticated, listCases, isMockEvidence, getContractConfig, registerUser, RoleEnum, createCase } from "@/lib/contract"
import { AuthClient } from "@dfinity/auth-client"
import { computeFileHash, formatHashForDisplay } from "@/lib/file-hash"

interface IntakeFormProps {
  onSubmit: (data: any) => void
  onNavigateToCases?: () => void
}

interface Case {
  id: string
  caseNumber: string
  leadInvestigator: {
    id: string
    name: string
    badgeNumber: string
  }
}

export default function IntakeForm({ onSubmit, onNavigateToCases }: IntakeFormProps) {
  const { user } = useAuth()
  console.log('🚀 INTAKE FORM RENDERED - User:', user)
  console.log('🚀 INTAKE FORM RENDERED - Props:', { onSubmit: !!onSubmit, onNavigateToCases: !!onNavigateToCases })
  
  const [formData, setFormData] = useState({
    caseId: "",
    itemNumber: "",
    evidenceType: "",
    description: "",
    location: "",
    reasonForCollection: "",
    handlingNotes: "",
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCases, setIsLoadingCases] = useState(true)
  const [isCreatingDefaultCase, setIsCreatingDefaultCase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [evidenceData, setEvidenceData] = useState<any>(null)
  const [blockchainStatus, setBlockchainStatus] = useState<{
    step: 'idle' | 'hashing' | 'registering' | 'confirming' | 'complete';
    message: string;
  }>({
    step: 'idle',
    message: ''
  })
  const [fileHash, setFileHash] = useState<string>('')

  // Debug form state changes
  useEffect(() => {
    console.log('Form state updated:', {
      formData,
      uploadedFile: !!uploadedFile,
      fileHash,
      isLoading,
      success: !!success,
      error: !!error
    })
  }, [formData, uploadedFile, fileHash, isLoading, success, error])

  // Debug component mount
  useEffect(() => {
    alert('🎯 INTAKE FORM COMPONENT MOUNTED!')
    console.log('🎯🎯🎯 INTAKE FORM COMPONENT MOUNTED 🎯🎯🎯')
  }, [])

  const createDefaultCase = async () => {
    try {
      setIsCreatingDefaultCase(true)
      const defaultCaseNumber = `CASE-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-001`
      const res = await createCase(defaultCaseNumber)
      console.log('Default case creation result:', res)
      if ('ok' in res) {
        const newCase = {
          id: res.ok.id,
          caseNumber: res.ok.caseNumber,
          leadInvestigator: { id: "", name: "", badgeNumber: "" },
        }
        setCases([newCase])
        setFormData(prev => ({ ...prev, caseId: res.ok.id }))
        console.log('Default case created:', res.ok.caseNumber, 'with ID:', res.ok.id)
        
        // Also store in localStorage for cases manager
        try {
          if (typeof window !== 'undefined') {
            const existingCases = JSON.parse(window.localStorage.getItem('lv_known_cases') || '[]')
            const updatedCases = [...existingCases, { id: res.ok.id, caseNumber: res.ok.caseNumber }]
            window.localStorage.setItem('lv_known_cases', JSON.stringify(updatedCases))
            console.log('Case stored in localStorage:', updatedCases)
          }
        } catch (e) {
          console.error('Failed to store case in localStorage:', e)
        }
        
        return true
      } else {
        console.error('Failed to create default case:', res.err)
      }
    } catch (error) {
      console.error('Failed to create default case:', error)
    } finally {
      setIsCreatingDefaultCase(false)
    }
    return false
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoadingCases(true)
        const results = await listCases()
        if (!mounted) return
        
        if (results.length === 0) {
          // No cases exist, create a default one
          const created = await createDefaultCase()
          if (!created && !mounted) return
        } else {
          // Map to local Case shape minimally
          setCases(
            results.map((c) => ({
              id: c.id,
              caseNumber: c.caseNumber,
              leadInvestigator: { id: "", name: "", badgeNumber: "" },
            })),
          )
        }
      } catch {
        if (!mounted) return
        // Try to create a default case even if listCases fails
        await createDefaultCase()
      } finally {
        if (!mounted) return
        setIsLoadingCases(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Cases listing removed (no REST/DB). Optional: pull from canister if supported.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    console.log('Form input changed:', { name, value })
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    console.log('Evidence type selected:', value)
    setFormData((prev) => ({ ...prev, evidenceType: value }))
  }

  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file.name, file.size)
    setUploadedFile(file)
    try {
      setBlockchainStatus({ step: 'hashing', message: 'Computing file hash...' })
      const hash = await computeFileHash(file)
      setFileHash(hash)
      console.log('File hash computed:', hash)
      setBlockchainStatus({ step: 'idle', message: '' })
    } catch (error) {
      console.error('Error computing file hash:', error)
      setError('Failed to compute file hash')
      setBlockchainStatus({ step: 'idle', message: '' })
    }
  }

  const handleSubmit = async () => {
    alert('🚀 HANDLE SUBMIT CALLED!')
    console.log('🚀🚀🚀 HANDLE SUBMIT CALLED 🚀🚀🚀', { uploadedFile: !!uploadedFile, user: !!user, formData })
    if (!uploadedFile || !user) {
      console.log('❌ Missing requirements:', { uploadedFile: !!uploadedFile, user: !!user })
      alert('❌ Missing file or user not logged in!')
      setError('Please upload a file and ensure you are logged in')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    console.log('Starting evidence submission...')

    try {
      // Ensure we have a case ID - create one if needed
      let caseId = formData.caseId
      console.log('Current case ID:', caseId)
      if (!caseId) {
        console.log('No case ID found, creating default case...')
        const created = await createDefaultCase()
        if (!created) {
          throw new Error('Failed to create a case for evidence logging')
        }
        caseId = formData.caseId
        console.log('Default case created with ID:', caseId)
      }

      // Use the computed file hash for evidence integrity
      console.log('🔐🔐🔐 COMPUTING FILE HASH 🔐🔐🔐')
      console.log('File details:', { name: uploadedFile.name, size: uploadedFile.size, type: uploadedFile.type })
      const initialHash = fileHash || await computeFileHash(uploadedFile)
      console.log('🔐 File hash computed:', initialHash)

      setBlockchainStatus({ step: 'registering', message: 'Registering evidence on Story Protocol blockchain...' })

      const typeVariant = (EvidenceTypeEnum as any)[formData.evidenceType] ?? EvidenceTypeEnum.OTHER
      
      // Get the user's identity for authenticated evidence logging
      console.log('Getting user identity...')
      const authClient = await AuthClient.create()
      const isAuthenticated = await authClient.isAuthenticated()
      console.log('User authenticated:', isAuthenticated)
      
      if (!isAuthenticated) {
        throw new Error('User is not authenticated. Please log in again.')
      }
      
      const identity = await authClient.getIdentity()
      console.log('Identity obtained:', !!identity, 'Principal:', identity?.getPrincipal()?.toText())
      
      const attemptLog = async () => {
        console.log('🔥🔥🔥 ATTEMPTING TO LOG EVIDENCE 🔥🔥🔥')
        console.log('Evidence parameters:', {
          caseId,
          itemNumber: formData.itemNumber,
          evidenceType: typeVariant,
          description: formData.description,
          location: formData.location,
          initialHash,
          hasIdentity: !!identity
        })
        
        const result = await logEvidenceAuthenticated({
          caseId: caseId,
          itemNumber: formData.itemNumber,
          evidenceType: typeVariant,
          description: formData.description,
          location: formData.location,
          initialHash,
          identity,
        })
        
        console.log('🔥🔥🔥 EVIDENCE LOGGING RESULT 🔥🔥🔥', result)
        return result
      }

      let res = await attemptLog()

      if ('err' in res && typeof res.err === 'string' && res.err.toLowerCase().includes('user not registered')) {
        try {
          const desiredRole = (typeof window !== 'undefined' ? localStorage.getItem('lv_role_override') : null) || 'ANALYST'
          const roleVariant = (RoleEnum as any)[desiredRole] || RoleEnum.ANALYST
          await registerUser({
            name: user?.name || '',
            email: user?.email || '',
            badgeNumber: user?.badgeNumber || '',
            role: roleVariant,
          })
          res = await attemptLog()
        } catch (regError) {
          console.error('User registration failed:', regError)
        }
      }

      if ('err' in res) {
        console.log('❌❌❌ EVIDENCE LOGGING FAILED ❌❌❌', res.err)
        throw new Error(res.err)
      }

      console.log('✅✅✅ EVIDENCE LOGGING SUCCESS ✅✅✅', res.ok)

      // If returned evidence looks like a dev mock, do not show success UI
      if (isMockEvidence(res.ok)) {
        console.log('⚠️⚠️⚠️ MOCK EVIDENCE DETECTED ⚠️⚠️⚠️')
        throw new Error("Canister not deployed: evidence not recorded on-chain")
      }

      setBlockchainStatus({ 
        step: 'complete', 
        message: `Successfully registered on blockchain! Story Protocol ID: ${formatHashForDisplay(res.ok.storyProtocolIpId)}` 
      })

      const evidenceRecord = {
        ...formData,
        fileName: uploadedFile.name,
        fileSize: (uploadedFile.size / 1024 / 1024).toFixed(2),
        timestamp: new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }),
        location: formData.location,
        hash: res.ok.initialHash,
        ipaRecord: res.ok.storyProtocolIpId,
        canisterId: res.ok.icpCanisterId,
      }

      // Persist locally so the dashboard can read (also useful in real flow as cache)
      console.log('💾💾💾 STORING EVIDENCE LOCALLY 💾💾💾')
      try {
        if (typeof window !== 'undefined') {
          const selectedCase = cases.find(c => c.id === formData.caseId)
          const storedRaw = window.localStorage.getItem('lv_mock_evidence')
          const stored: any[] = storedRaw ? JSON.parse(storedRaw) : []
          const compositeId = `CASE-${formData.caseId}-${formData.itemNumber}`
          const backendId = (res as any).ok?.id
          const toStore = {
            id: compositeId,
            itemNumber: formData.itemNumber,
            evidenceType: formData.evidenceType || 'OTHER',
            description: formData.description,
            collectedAt: new Date().toISOString(),
            location: formData.location,
            initialHash: evidenceRecord.hash,
            storyProtocolIpId: evidenceRecord.ipaRecord,
            icpCanisterId: evidenceRecord.canisterId,
            case: {
              id: formData.caseId,
              caseNumber: selectedCase?.caseNumber || formData.caseId,
            },
            collectedBy: {
              id: user?.id || '',
              name: user?.name || 'Unknown',
              badgeNumber: user?.badgeNumber || 'N/A',
            },
            custodyLogs: [],
          }
          console.log('💾 Storing evidence:', toStore)
          const dedup = [...stored.filter(e => e.id !== toStore.id), toStore]
          window.localStorage.setItem('lv_mock_evidence', JSON.stringify(dedup))
          console.log('💾 Evidence stored in localStorage')

          // Maintain quick index per case
          const mapRaw = window.localStorage.getItem('lv_case_evidence_ids')
          const map: Record<string, string[]> = mapRaw ? JSON.parse(mapRaw) : {}
          const shortId = `${selectedCase?.caseNumber || formData.caseId}-${formData.itemNumber}`
          const arr = new Set([...(map[formData.caseId] || []), toStore.id, backendId, shortId].filter(Boolean) as string[])
          map[formData.caseId] = Array.from(arr)
          window.localStorage.setItem('lv_case_evidence_ids', JSON.stringify(map))
          console.log('💾 Case evidence index updated')
        }
      } catch (e) {
        console.error('💾 Failed to store evidence locally:', e)
      }

      setEvidenceData(evidenceRecord)
      setSuccess(`Evidence item ${formData.itemNumber} recorded successfully!`)
      console.log('🎉🎉🎉 EVIDENCE CREATION COMPLETED SUCCESSFULLY 🎉🎉🎉')
      console.log('Evidence record:', evidenceRecord)
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      const message = err instanceof Error ? err.message : String(err)
      // Provide a helpful hint when canister is not deployed (dev flow)
      const cfg = getContractConfig()
      const isNoWasm = message.includes('IC0537') || message.toLowerCase().includes('not deployed') || message.toLowerCase().includes('no wasm')
      const hint = isNoWasm
        ? `Canister not deployed; evidence was not recorded on-chain.\nCanister: ${cfg.canisterId ?? '<missing>'}\nHost: ${cfg.host}\nIn dev, run: dfx start (in one terminal) and dfx deploy (in another), then restart the app.`
        : message
      console.error('Error creating evidence item:', err)
      setError(hint)
    } finally {
      console.log('handleSubmit completed, setting loading to false')
      setIsLoading(false)
    }
  }

  const handleProceedToLifecycle = () => {
    if (evidenceData) {
      onSubmit(evidenceData)
    }
  }

  const handleResetForm = () => {
    setFormData({
      caseId: "",
      itemNumber: "",
      evidenceType: "",
      description: "",
      location: "",
      reasonForCollection: "",
      handlingNotes: "",
    })
    setUploadedFile(null)
    setError(null)
    setSuccess(null)
    setEvidenceData(null)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* DEBUG: This should show if the form is rendered */}
      <div style={{ background: 'red', color: 'white', padding: '10px', margin: '10px' }}>
        🚨 DEBUG: INTAKE FORM IS RENDERED! 🚨
      </div>
      {/* Left Column */}
      <Card className="border border-border bg-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Case & Evidence Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Case</label>
            <Select value={formData.caseId} onValueChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder={
                  isLoadingCases ? "Loading cases..." : 
                  isCreatingDefaultCase ? "Creating default case..." : 
                  "Select a case"
                } />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {isLoadingCases || isCreatingDefaultCase ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {isCreatingDefaultCase ? "Creating default case..." : "Loading cases..."}
                  </div>
                ) : Array.isArray(cases) && cases.length > 0 ? (
                  cases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.caseNumber} - {caseItem.leadInvestigator.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No cases available</div>
                )}
              </SelectContent>
            </Select>
            {!isLoadingCases && Array.isArray(cases) && cases.length === 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 mb-2">
                  No cases found. You can create a case manually or continue with evidence logging.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-800 border-blue-300 hover:bg-blue-100"
                  onClick={() => {
                    if (onNavigateToCases) {
                      onNavigateToCases()
                    }
                  }}
                >
                  Manage Cases
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Evidence Item #</label>
            <Input
              name="itemNumber"
              placeholder="e.g., 001"
              value={formData.itemNumber}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Evidence Type</label>
            <Select value={formData.evidenceType} onValueChange={handleSelectChange}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select evidence type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="LAPTOP_HARD_DRIVE">Laptop Hard Drive</SelectItem>
                <SelectItem value="MOBILE_PHONE">Mobile Phone</SelectItem>
                <SelectItem value="USB_DRIVE">USB Drive</SelectItem>
                <SelectItem value="SURVEILLANCE_FOOTAGE">Surveillance Footage</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              name="description"
              placeholder="e.g., Samsung 700z laptop seized from suspect's desk."
              value={formData.description}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Location</label>
            <Input
              name="location"
              placeholder="e.g., 37.7749° N, 122.4194° W"
              value={formData.location}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Reason for Collection</label>
            <Textarea
              name="reasonForCollection"
              placeholder="e.g., Digital forensics investigation"
              value={formData.reasonForCollection}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Handling Notes</label>
            <Textarea
              name="handlingNotes"
              placeholder="e.g., Handled with proper chain of custody"
              value={formData.handlingNotes}
              onChange={handleInputChange}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-20"
            />
          </div>

          {/* Read-only fields */}
          <div className="mt-6 space-y-3 border-t border-border pt-6">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Timestamp:</span>
              <span className="text-foreground">Oct 15, 2025, 10:30:15 AM UTC</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="text-foreground">37.7749° N, 122.4194° W</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Right Column */}
      <Card className="border border-border bg-card p-6 flex flex-col">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Record Forensic Image</h2>

        <FileUploadArea onFileUpload={handleFileUpload} />

        {blockchainStatus.step !== 'idle' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              {blockchainStatus.step !== 'complete' && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="text-sm text-blue-800">{blockchainStatus.message}</span>
            </div>
          </div>
        )}

        {fileHash && (
          <div className="mb-4 p-3 bg-muted border border-border rounded-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">File Hash:</span> {formatHashForDisplay(fileHash)}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={handleProceedToLifecycle}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                View in Evidence Lifecycle
              </Button>
              <Button
                onClick={handleResetForm}
                size="sm"
                variant="outline"
                className="border-border text-foreground hover:bg-input"
              >
                Log Another Item
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={() => {
            alert('🔥 BUTTON CLICKED! Check console for details.')
            console.log('🔥🔥🔥 SUBMIT BUTTON CLICKED 🔥🔥🔥')
            console.log('Form validation:', {
              uploadedFile: !!uploadedFile,
              itemNumber: formData.itemNumber,
              evidenceType: formData.evidenceType,
              description: formData.description,
              isLoading,
              success: !!success,
              isCreatingDefaultCase
            })
            console.log('Current formData:', formData)
            console.log('Button disabled:', !uploadedFile || !formData.itemNumber || !formData.evidenceType || !formData.description || isLoading || !!success || isCreatingDefaultCase)
            handleSubmit()
          }}
          disabled={!uploadedFile || !formData.itemNumber || !formData.evidenceType || !formData.description || isLoading || !!success || isCreatingDefaultCase}
          className="mt-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : isCreatingDefaultCase ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Case...
            </>
          ) : success ? (
            "Evidence Recorded Successfully"
          ) : (
            "Calculate Hash & Record Evidence"
          )}
        </Button>
      </Card>
    </div>
  )
}
