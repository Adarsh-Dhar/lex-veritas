"use client"

import { useEffect, useRef } from "react"

interface QRCodeProps {
  value: string
}

export default function QRCode({ value }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Simple QR code placeholder - in production, use a library like qrcode.react
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 200
    canvas.height = 200

    // Draw background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 200, 200)

    // Draw border
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, 200, 200)

    // Draw simple pattern (placeholder)
    ctx.fillStyle = "#000000"
    const moduleSize = 10
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize)
        }
      }
    }

    // Draw text
    ctx.fillStyle = "#666666"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"
    ctx.fillText(value.substring(0, 12), 100, 220)
  }, [value])

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="border-2 border-border rounded-lg bg-white p-2" />
    </div>
  )
}
