"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { AuthClient } from "@dfinity/auth-client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info, Lock } from "lucide-react"

export default function LoginPage() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [principal, setPrincipal] = useState<string>("Click \"Whoami\" to see your principal ID")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("")

  const identityProvider = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_II_URL
    if (envUrl && envUrl.length > 0) return envUrl
    // Default: mainnet II
    return "https://identity.internetcomputer.org"
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const client = await AuthClient.create()
        if (!mounted) return
        setAuthClient(client)
        const authed = await client.isAuthenticated()
        setIsAuthenticated(authed)
      } catch (e: any) {
        setError(e?.message || "Failed to initialize authentication")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const login = async () => {
    if (!authClient) return
    setError("")
    setBusy(true)
    try {
      const isLocalII =
        identityProvider.includes("localhost:4943") || identityProvider.includes("127.0.0.1:4943")
      await authClient.login({
        identityProvider,
        ...(isLocalII ? { derivationOrigin: window.location.origin } : {}),
        onSuccess: async () => {
          setIsAuthenticated(true)
          try {
            // Persist desired role for post-login registration handled in auth-context
            localStorage.setItem("lv_desired_role", selectedRole)
            localStorage.setItem("lv_role_override", selectedRole)
            // eslint-disable-next-line no-console
            console.info('[Login] Selected role', { selectedRole })
          } catch {}
          // Refresh so AuthProvider restores II session and loads dashboard
          try { window.location.href = "/" } catch {}
        },
        onError: (err) => {
          const message = typeof err === "string" ? err : (err as any)?.message || "Login failed"
          setError(message)
        },
      })
    } catch (err) {
      const message = (err as any)?.message || "Login failed"
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    if (!authClient) return
    setError("")
    setBusy(true)
    try {
      await authClient.logout()
      setIsAuthenticated(false)
      setPrincipal("Click \"Whoami\" to see your principal ID")
    } catch (err) {
      const message = (err as any)?.message || "Logout failed"
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const whoami = async () => {
    setError("")
    setPrincipal("Loading...")
    try {
      if (!authClient) return
      const identity = authClient.getIdentity()
      const principalText = identity.getPrincipal().toText()
      setPrincipal(principalText || "2vxsx-fae")
    } catch (err) {
      setPrincipal("2vxsx-fae")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl border-border/50 shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Integrating Internet Identity</CardTitle>
              <CardDescription>Authenticate and retrieve your principal (Whoami)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mb-6 rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  A <strong>principal</strong> is a unique identifier on the Internet Computer. It represents an
                  entity (user, canister smart contract, or other) and is used for identification and authorization.
                </p>
                <p>
                  Click <span className="font-medium">Whoami</span> to see the principal you are interacting with. If
                  you are not signed in, you will see the anonymous principal <code>2vxsx-fae</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Choose your role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="ANALYST">Analyst</SelectItem>
                    <SelectItem value="PROSECUTOR">Prosecutor</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isAuthenticated ? (
              <Button type="button" variant="default" disabled={busy || !authClient || !selectedRole} onClick={login}>
                {busy ? "Opening Internet Identity..." : (!selectedRole ? "Select a role to continue" : "Login with Internet Identity")}
              </Button>
            ) : (
              <Button type="button" variant="outline" disabled={busy} onClick={logout}>
                Logout
              </Button>
            )}

            <Button type="button" variant="secondary" disabled={busy || !authClient} onClick={whoami}>
              Whoami
            </Button>
          </div>

          {principal && (
            <div className="mt-6">
              <h3 className="text-sm text-muted-foreground">Your principal ID is:</h3>
              <div className="mt-2 rounded-md border border-border/60 bg-background/60 p-3 font-mono text-sm">
                {principal}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
