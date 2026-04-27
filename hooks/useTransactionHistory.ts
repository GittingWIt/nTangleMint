import { useEffect, useState } from "react"
import useSWR from "swr"

interface Transaction {
  txId: string
  timestamp: number
  type: "nTangled" | "nProcess" | "nRedeemed" | "faucet"
  amount: number
  programName?: string
  programId?: string
  status: "confirmed" | "pending"
  blockHeight?: number
}

export function useTransactionHistory(address: string | null) {
  const { data, error, isLoading } = useSWR(
    address ? `/api/external/transactions?address=${address}` : null,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      const data = await response.json()
      return data.transactions || []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
      focusThrottleInterval: 150000, // Revalidate every 2.5 minutes
    }
  )

  return {
    transactions: data || [],
    isLoading,
    error,
    isEmpty: data && data.length === 0
  }
}

export function formatTransactionType(type: string): string {
  switch (type) {
    case "nTangled":
      return "Punch Card Created"
    case "nProcess":
      return "Punch Added"
    case "nRedeemed":
      return "Reward Redeemed"
    case "faucet":
      return "Deposit"
    default:
      return "Transaction"
  }
}

export function formatTransactionAmount(satoshis: number, type: string): string {
  const bsv = satoshis / 100_000_000
  if (type === "faucet" || type === "nTangled") {
    return `+${bsv.toFixed(8)} BSV`
  }
  return `${bsv.toFixed(8)} BSV`
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case "nTangled":
      return "text-blue-600"
    case "nProcess":
      return "text-green-600"
    case "nRedeemed":
      return "text-purple-600"
    case "faucet":
      return "text-emerald-600"
    default:
      return "text-gray-600"
  }
}