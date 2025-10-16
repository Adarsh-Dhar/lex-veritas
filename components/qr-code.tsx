"use client"

import { useEffect, useRef } from "react"

interface QRCodeProps {
  value: string
}

export default function QRCode({ value }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // TODO: Implement real QR code generation using a library like qrcode.react
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

    // Draw placeholder text
    ctx.fillStyle = "#666666"
    ctx.font = "12px monospace"
    ctx.textAlign = "center"
    ctx.fillText("QR Code", 100, 100)
    ctx.fillText("Not Implemented", 100, 120)
  }, [value])

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="border-2 border-border rounded-lg bg-white p-2" />
    </div>
  )
}
