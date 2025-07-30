"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X, Package, Coffee, Tag, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createProgram, type CreateProgramFormData, type Product } from "./actions"
import { UPCLookup } from "@/components/upc-lookup"

export default function CreateProgramPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [walletData, setWalletData] = useState<{ publicAddress: string; type: string } | null>(null)

  // Form state
  const [programType, setProgramType] = useState<"punch-card" | "coupon-book">("punch-card")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [requiredPunches, setRequiredPunches] = useState(5)
  const [totalCoupons, setTotalCoupons] = useState(10)
  const [rewardDescription, setRewardDescription] = useState("")
  const [discountAmount, setDiscountAmount] = useState("")
  const [expirationDate, setExpirationDate] = useState<Date>()
  const [products, setProducts] = useState<Product[]>([])
  const [merchantName, setMerchantName] = useState("")
  const [businessName, setBusinessName] = useState("")

  // Load wallet data
  useEffect(() => {
    const loadWalletData = () => {
      try {
        // Check bsv-wallet-session first
        const sessionData = localStorage.getItem("bsv-wallet-session")
        if (sessionData) {
          const parsed = JSON.parse(sessionData)
          setWalletData({
            publicAddress: parsed.address,
            type: parsed.type,
          })
          setMerchantName(parsed.businessName || "")
          setBusinessName(parsed.businessName || "")
          return
        }

        // Fallback to devWalletData
        const devData = localStorage.getItem("devWalletData")
        if (devData) {
          const parsed = JSON.parse(devData)
          setWalletData(parsed)
          setMerchantName(parsed.businessName || "Local Merchant")
          setBusinessName(parsed.businessName || "Local Business")
          return
        }

        console.log("❌ No wallet data found")
      } catch (error) {
        console.error("Error loading wallet data:", error)
      }
    }

    loadWalletData()
  }, [])

  const addProduct = (product: Product) => {
    console.log("Adding product:", product)
    // Ensure we don't add duplicates
    const exists = products.some((p) => p.name === product.name && p.upc === product.upc)
    if (!exists) {
      setProducts([...products, product])
      console.log("Product added successfully")
    } else {
      console.log("Product already exists, skipping")
    }
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const handleProductSelect = (product: any) => {
    console.log("Product selected from UPC lookup:", product)
    if (product && product.name) {
      const newProduct: Product = {
        name: product.name,
        upc: product.upc || undefined,
      }
      addProduct(newProduct)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walletData) {
      alert("No wallet found. Please create or restore a wallet first.")
      return
    }

    if (!name.trim() || !description.trim() || !rewardDescription.trim()) {
      alert("Please fill in all required fields.")
      return
    }

    setIsSubmitting(true)

    try {
      // Build form data with proper types
      const formData: CreateProgramFormData = {
        name: name.trim(),
        description: description.trim(),
        type: programType,
        rewardDescription: rewardDescription.trim(),
        discountAmount: discountAmount.trim() || undefined,
        expirationDate: expirationDate?.toISOString(),
        products,
        merchantName: merchantName.trim(),
        businessName: businessName.trim(),
      }

      // Only add type-specific properties when they're relevant and valid
      if (programType === "punch-card") {
        formData.requiredPunches = requiredPunches
      }

      if (programType === "coupon-book") {
        formData.totalCoupons = totalCoupons
      }

      console.log("🔄 Submitting program creation:", formData)

      const result = await createProgram(formData)

      if (result.success && result.program) {
        // Set the actual merchant address
        const programWithMerchantAddress = {
          ...result.program,
          merchantAddress: walletData.publicAddress,
          isLocal: true,
          broadcastedToBSV: false,
        }

        // Save to localStorage with proper key structure
        const merchantProgramsKey = `merchant-programs-${walletData.publicAddress}`
        const existingPrograms = JSON.parse(localStorage.getItem(merchantProgramsKey) || "[]")
        const updatedPrograms = [...existingPrograms, programWithMerchantAddress]
        localStorage.setItem(merchantProgramsKey, JSON.stringify(updatedPrograms))

        console.log("✅ Program saved to localStorage:", programWithMerchantAddress)
        console.log("✅ Storage key:", merchantProgramsKey)

        // Also save to general programs list for public page
        const allPrograms = JSON.parse(localStorage.getItem("all-programs") || "[]")
        allPrograms.push(programWithMerchantAddress)
        localStorage.setItem("all-programs", JSON.stringify(allPrograms))

        // Dispatch events to notify other components
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new Event("programsUpdated"))

        alert("Program created successfully!")
        router.push("/merchant?created=true")
      } else {
        alert(result.message || "Failed to create program")
      }
    } catch (error) {
      console.error("❌ Error creating program:", error)
      alert("Error creating program. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!walletData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Wallet Found</h1>
          <p className="text-muted-foreground mb-4">Please create or restore a merchant wallet to create programs.</p>
          <Button onClick={() => router.push("/wallet-generation")}>Create Wallet</Button>
        </div>
      </div>
    )
  }

  if (walletData.type !== "merchant") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Only merchant wallets can create loyalty programs.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Loyalty Program</h1>
          <p className="text-muted-foreground">Design a custom loyalty program for your customers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Program Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Program Type</CardTitle>
            <CardDescription>Choose the type of loyalty program you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={programType} onValueChange={(value) => setProgramType(value as "punch-card" | "coupon-book")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="punch-card" className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  Punch Card
                </TabsTrigger>
                <TabsTrigger value="coupon-book" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Coupon Book
                </TabsTrigger>
              </TabsList>

              <TabsContent value="punch-card" className="mt-4">
                <div className="p-4 border rounded-lg bg-amber-50">
                  <h3 className="font-semibold text-amber-800 mb-2">Punch Card Program</h3>
                  <p className="text-sm text-amber-700">
                    Customers collect punches with each purchase. After reaching the required number of punches, they
                    earn a reward.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="coupon-book" className="mt-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-2">Coupon Book Program</h3>
                  <p className="text-sm text-green-700">
                    Customers receive a book of coupons they can use for discounts on future purchases.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Provide the basic details for your loyalty program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Coffee Lovers Rewards"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchantName">Merchant Name *</Label>
                <Input
                  id="merchantName"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Your business name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your loyalty program..."
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Program Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Program Configuration</CardTitle>
            <CardDescription>Configure the specific settings for your program type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {programType === "punch-card" && (
              <div className="space-y-2">
                <Label htmlFor="requiredPunches">Required Punches</Label>
                <Select
                  value={requiredPunches.toString()}
                  onValueChange={(value) => setRequiredPunches(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 8, 10, 12, 15].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} punches
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {programType === "coupon-book" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCoupons">Total Coupons</Label>
                  <Select
                    value={totalCoupons.toString()}
                    onValueChange={(value) => setTotalCoupons(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} coupons
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Discount Amount</Label>
                  <Input
                    id="discountAmount"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="e.g., 10% or $5"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rewardDescription">Reward Description *</Label>
              <Input
                id="rewardDescription"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                placeholder="e.g., Free coffee, 20% off next purchase"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Expiration Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expirationDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expirationDate ? format(expirationDate, "PPP") : "Select expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expirationDate} onSelect={setExpirationDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Applicable Products (Optional)
            </CardTitle>
            <CardDescription>
              Specify which products this program applies to. Leave empty to apply to all products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search and Add Products</Label>
              <UPCLookup onProductSelect={handleProductSelect} />
            </div>

            {products.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Products ({products.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {products.map((product, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {product.name}
                      {product.upc && <span className="text-xs opacity-70">({product.upc})</span>}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeProduct(index)} />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click the × to remove a product from the program</p>
              </div>
            )}

            {products.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No products selected</p>
                <p className="text-xs">Use the search above to add products, or leave empty to apply to all products</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Program Preview</CardTitle>
            <CardDescription>See how your program will appear to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{name || "Program Name"}</h3>
                  <p className="text-sm text-muted-foreground">{merchantName || "Business Name"}</p>
                </div>
                <Badge variant={programType === "punch-card" ? "default" : "secondary"}>
                  {programType === "punch-card" ? "Punch Card" : "Coupon Book"}
                </Badge>
              </div>

              <p className="text-sm mb-3">{description || "Program description will appear here..."}</p>

              {programType === "punch-card" && (
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="h-4 w-4" />
                  <span className="text-sm">
                    Collect {requiredPunches} punches to earn: {rewardDescription || "reward"}
                  </span>
                </div>
              )}

              {programType === "coupon-book" && (
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm">
                    {totalCoupons} coupons • {discountAmount || "Discount"} • {rewardDescription || "reward"}
                  </span>
                </div>
              )}

              {expirationDate && (
                <p className="text-xs text-muted-foreground">Expires: {format(expirationDate, "PPP")}</p>
              )}

              {products.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Applies to: {products.map((p) => p.name).join(", ")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Program"}
          </Button>
        </div>
      </form>
    </div>
  )
}