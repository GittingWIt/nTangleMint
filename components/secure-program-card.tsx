"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { performSecurityCheck } from "@/lib/wallet-security-guard"

interface SecureProgramCardProps {
  program: any
  walletData: any
  onInteract: (program: any) => void
}

export function SecureProgramCard({ program, walletData, onInteract }: SecureProgramCardProps) {
  const [securityCheck, setSecurityCheck] = useState<any>(null)

  useEffect(() => {
    const check = performSecurityCheck()
    setSecurityCheck(check)
  }, [])

  // SECURITY: Never show manage buttons to customers
  const canManageProgram = () => {
    if (!walletData || !securityCheck?.isValid) return false

    // Only merchants can manage programs
    if (walletData.type !== "merchant") return false

    // Only if they own the program
    return program.merchantAddress === walletData.publicAddress
  }

  // SECURITY: Customers should only see join/view options
  const getActionButton = () => {
    if (!walletData) {
      return <Button onClick={() => onInteract(program)}>Get Started</Button>
    }

    if (walletData.type === "customer") {
      const hasJoined = program.participants?.includes(walletData.publicAddress)
      return (
        <Button onClick={() => onInteract(program)} disabled={hasJoined}>
          {hasJoined ? "Joined" : "Join Program"}
        </Button>
      )
    }

    if (walletData.type === "merchant" && canManageProgram()) {
      return <Button onClick={() => onInteract(program)}>Manage Program</Button>
    }

    return (
      <Button variant="outline" onClick={() => onInteract(program)}>
        View Details
      </Button>
    )
  }

  // SECURITY: Show warning if security issues detected
  if (securityCheck && !securityCheck.isValid) {
    return (
      <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
        <h3 className="text-red-800 font-semibold">Security Issue Detected</h3>
        <p className="text-red-600 text-sm">Please refresh the page to resolve wallet inconsistencies.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{program.name}</h3>
        <Badge variant={program.status === "active" ? "default" : "secondary"}>{program.status}</Badge>
      </div>

      <p className="text-sm text-gray-600 mb-3">{program.description}</p>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{program.participants?.length || 0} participants</span>
        {getActionButton()}
      </div>
    </div>
  )
}