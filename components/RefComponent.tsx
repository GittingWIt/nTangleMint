"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function RefComponent() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("Initial Message")

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
      setMessage(inputRef.current.value || "No value")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  return (
    <div>
      <Input ref={inputRef} onChange={handleChange} />
      <Button onClick={handleClick}>Focus Input</Button>
      <p>{message}</p>
    </div>
  )
}