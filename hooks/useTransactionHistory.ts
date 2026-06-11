import { useEffect, useState } from "react"
import useSWR from "swr"

interface Transaction {
  txId: string
  timestamp: number
  type: "Create" | "nTangle" | "nProcess" | "Redeem" | "Delete"
  amount: number
  programName?: string
  programId?: string
  status: "confirmed" | "pending"
  blockHeight?: number
}

export function useTransactionHistory(address: string | null) {
  console.log("[v0] useTransactionHistory called with address:", address)
  
  const { data, error, isLoading } = useSWR(
    address ? `/api/external/transactions?address=${address}` : null,
    async (url) => {
      console.log("[v0] useTransactionHistory fetching from:", url)
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      const data = await response.json()
      console.log("[v0] useTransactionHistory response:", data)
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
    case "Create":
      return "Create"
    case "nTangle":
      return "nTangle"
    case "nProcess":
      return "nProcess"
    case "Redeem":
      return "Redeem"
    case "Delete":
      return "Delete"
    default:
      return "Transaction"
  }
}

export function formatTransactionAmount(satoshis: number, type: string): string {
  const bsv = satoshis / 100_000_000
  return `${bsv.toFixed(8)} BSV`
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case "Create":
      return "text-red-600" // Debit - registration cost
    case "nTangle":
      return "text-green-600" // Credit - customer payment
    case "nProcess":
      return "text-green-600" // Credit - customer payment
    case "Redeem":
      return "text-blue-600" // Neutral - net 0 for creator
    case "Delete":
      return "text-red-600" // Debit - program deletion
    default:
      return "text-gray-600"
  }
}