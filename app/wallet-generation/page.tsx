"use client"

import dynamic from "next/dynamic"
import { Suspense, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getWalletData } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Dynamically import form components
const CreateWalletForm = dynamic(() => import("./create-wallet-form"), {
  loading: () => <LoadingSpinner />,
})

const RestoreWalletForm = dynamic(() => import("./restore-wallet-form"), {
  loading: () => <LoadingSpinner />,
})

export default function WalletGeneration() {
  const [activeTab, setActiveTab] = useState("create")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkExistingWallet = async () => {
      try {
        const existingWallet = await getWalletData()
        if (existingWallet?.type) {
          console.log("[Wallet Generation] Existing wallet found, redirecting to:", existingWallet.type)
          window.location.href = `/${existingWallet.type}`
        } else {
          setIsLoading(false)
        }
      } catch (err) {
        console.error("[Wallet Generation] Error checking existing wallet:", err)
        setIsLoading(false)
      }
    }

    checkExistingWallet()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Wallet Setup</CardTitle>
          <CardDescription>Create a new wallet or restore an existing one</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="restore">Restore</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <Suspense fallback={<LoadingSpinner />}>
                <CreateWalletForm />
              </Suspense>
            </TabsContent>
            <TabsContent value="restore">
              <Suspense fallback={<LoadingSpinner />}>
                <RestoreWalletForm />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}