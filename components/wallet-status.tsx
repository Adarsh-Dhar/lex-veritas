'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, Wallet, ExternalLink } from 'lucide-react'
import { getCanisterEthAddress, checkBalance } from '@/lib/contract'

export function WalletStatus() {
  const [address, setAddress] = useState<string>('')
  const [balance, setBalance] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWalletInfo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [addr, bal] = await Promise.all([
        getCanisterEthAddress(),
        checkBalance()
      ])
      
      setAddress(addr)
      setBalance('ok' in bal ? bal.ok : 'Error loading balance')
    } catch (err) {
      console.error('Error loading wallet info:', err)
      setError(err instanceof Error ? err.message : 'Failed to load wallet info')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWalletInfo()
  }, [])

  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getExplorerUrl = (addr: string) => {
    // For Story Protocol Odyssey testnet
    return `https://explorer.story.foundation/address/${addr}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Blockchain Wallet Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadWalletInfo}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Ethereum Address:</span>
              {address && (
                <a
                  href={getExplorerUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <code className="font-mono">{formatAddress(address)}</code>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            
            {address && (
              <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                {address}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Balance:</span>
              <span className="text-sm font-mono">{balance}</span>
            </div>
          </div>

          {address && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                This address is used to pay for Story Protocol transactions. 
                Ensure it has sufficient ETH for gas fees.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}