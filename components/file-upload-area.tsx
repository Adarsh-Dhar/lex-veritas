"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"

interface FileUploadAreaProps {
  onFileUpload: (file: File) => void
}

export default function FileUploadArea({ onFileUpload }: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      onFileUpload(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      onFileUpload(file)
    }
  }

  return (
    <div className="flex-1">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border bg-input/30"
        }`}
      >
        <input type="file" onChange={handleFileInput} className="hidden" id="file-input" accept=".E01,.DD,.RAW,.AFF,.pdf,.jpg,.jpeg" />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground font-semibold mb-1">Drag & Drop Evidence File Here</p>
          <p className="text-sm text-muted-foreground mb-4">Supported formats: .E01, .DD, .RAW, .AFF, .PDF, .JPG, .JPEG</p>
        </label>
      </div>

      {uploadedFile && (
        <div className="mt-4 p-4 bg-input/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">File uploaded:</p>
          <p className="text-foreground font-semibold">{uploadedFile.name}</p>
          <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  )
}
