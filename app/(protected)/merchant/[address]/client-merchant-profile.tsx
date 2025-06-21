"use client"

import { useEffect } from "react"
import MerchantProfilePage from "./page"

export default function ClientMerchantProfile({ params }: { params: { address: string } }) {
  // Apply fixes when the component mounts
  useEffect(() => {
    // Fix for "i is not a function" error
    if (typeof window !== "undefined") {
      // Define i as a no-op function if it doesn't exist or isn't a function
      if (typeof (window as any).i !== "function") {
        ;(window as any).i = () => null
      }

      // Define s as a no-op function if it doesn't exist or isn't a function
      if (typeof (window as any).s !== "function") {
        ;(window as any).s = () => null
      }
    }
  }, [])

  return <MerchantProfilePage params={params} />
}