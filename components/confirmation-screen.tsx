"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy, Link2, Database, Printer } from "lucide-react"
import QRCode from "./qr-code"

interface ConfirmationScreenProps {
  data: any
  onNewEvidence: () => void
}

export default function ConfirmationScreen({ data, onNewEvidence }: ConfirmationScreenProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border border-border bg-card p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground">Evidence Recorded Successfully</h2>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Case Number:</span>
                <span className="text-foreground font-semibold">{data.caseNumber}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Evidence Item #:</span>
                <span className="text-foreground font-semibold">{data.evidenceItem}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">File Name:</span>
                <span className="text-foreground font-semibold">{data.fileName}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">File Size:</span>
                <span className="text-foreground font-semibold">{data.fileSize} MB</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">SHA-256 Hash:</span>
                <span className="text-foreground font-mono text-sm">{data.hash}</span>
              </div>

              {/* Blockchain Details */}
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Story Protocol (IPA Record):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-mono text-sm">{data.ipaRecord}</span>
                    <button
                      onClick={() => copyToClipboard(data.ipaRecord)}
                      className="p-1 hover:bg-input rounded transition-colors"
                      title="Copy ID"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">ICP Canister (Storage):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-mono text-sm">{data.canisterId}</span>
                    <button
                      onClick={() => copyToClipboard(data.canisterId)}
                      className="p-1 hover:bg-input rounded transition-colors"
                      title="Copy ID"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            <QRCode value={data.ipaRecord} />
            <p className="text-sm text-muted-foreground text-center mt-4">
              Print and affix this tag to the physical evidence bag.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6 border-t border-border">
          <Button
            onClick={() => window.print()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Evidence Tag
          </Button>
          <Button
            onClick={onNewEvidence}
            variant="outline"
            className="border-border text-foreground hover:bg-input font-semibold px-8 bg-transparent"
          >
            Log New Evidence Item
          </Button>
        </div>
      </Card>
    </div>
  )
}
