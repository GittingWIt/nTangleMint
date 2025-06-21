"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Key, Shield, Coins, RefreshCw } from "lucide-react"
import CreateWalletForm from "./create-wallet-form"
import RestoreWalletForm from "./restore-wallet-form"

export default function WalletGeneration() {
  const [activeTab, setActiveTab] = useState("create")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">nTangleMint Wallet</h1>
          <p className="text-slate-600">Secure BSV blockchain wallet with on-chain metadata storage</p>
          <Badge variant="secondary" className="mt-4 inline-flex items-center gap-1">
            <Coins className="w-3 h-3" />
            BSV Blockchain Powered
          </Badge>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">Wallet Management</CardTitle>
            <CardDescription>Create a new wallet or restore from your recovery phrase</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Create New Wallet
                </TabsTrigger>
                <TabsTrigger value="restore" className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Restore Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Create New Wallet</h3>
                  <p className="text-sm text-slate-600">
                    Generate a new wallet with metadata stored on the BSV blockchain
                  </p>
                </div>
                <CreateWalletForm />
              </TabsContent>

              <TabsContent value="restore" className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Restore Existing Wallet</h3>
                  <p className="text-sm text-slate-600">
                    Restore your wallet using your recovery phrase and BSV blockchain metadata
                  </p>
                </div>
                <RestoreWalletForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <Shield className="w-10 h-10 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-2">Blockchain Security</h3>
            <p className="text-sm text-slate-600">Wallet metadata stored securely on BSV blockchain</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <Coins className="w-10 h-10 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold mb-2">BSV Integration</h3>
            <p className="text-sm text-slate-600">Native Bitcoin SV support with low fees</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <Key className="w-10 h-10 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold mb-2">Self-Custody</h3>
            <p className="text-sm text-slate-600">You control your private keys and data</p>
          </div>
        </div>
      </div>
    </div>
  )
}