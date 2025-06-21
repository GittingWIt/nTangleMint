"use client"

import type React from "react"
import { Input } from "@/components/ui/input"

interface UpcCodeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSubmit?: () => void
}

export function UpcCodeInput({ onSubmit, ...props }: UpcCodeInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  return <Input placeholder="Enter UPC code" onKeyDown={handleKeyDown} {...props} />
}