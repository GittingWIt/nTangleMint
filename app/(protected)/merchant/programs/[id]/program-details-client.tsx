"use client"

import type React from "react"
import type { Program, Product } from "@/types"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"

// Define the props interface for the component
interface ProgramDetailsClientProps {
  initialProgram: Program
  initialProducts: Product[]
  programId: string
}

// Inline implementation of useToast
const useToast = () => {
  const toast = ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`Toast: ${title} - ${description} (${variant || "default"})`)
    // In a real implementation, this would show a toast notification
  }
  return { toast }
}

// Inline implementation of storageService
const storageService = {
  getPrograms: () => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem("programs") || "[]")
    } catch (error) {
      console.error("Error getting programs:", error)
      return []
    }
  },

  getProgram: (id: string) => {
    if (typeof window === "undefined") return null
    try {
      const programs = JSON.parse(localStorage.getItem("programs") || "[]")
      return programs.find((p: any) => p.id === id) || null
    } catch (error) {
      console.error("Error getting program:", error)
      return null
    }
  },

  saveProgram: (program: Program) => {
    if (typeof window === "undefined") return
    try {
      const programs = JSON.parse(localStorage.getItem("programs") || "[]")
      const index = programs.findIndex((p: any) => p.id === program.id)
      if (index >= 0) {
        programs[index] = program
      } else {
        programs.push(program)
      }
      localStorage.setItem("programs", JSON.stringify(programs))
    } catch (error) {
      console.error("Error saving program:", error)
    }
  },

  getProductsForProgram: (programId: string) => {
    if (typeof window === "undefined") return []
    try {
      const program = storageService.getProgram(programId)
      return program?.metadata?.products || []
    } catch (error) {
      console.error("Error getting products:", error)
      return []
    }
  },

  getUpcCodesForProgram: (programId: string) => {
    if (typeof window === "undefined") return []
    try {
      const program = storageService.getProgram(programId)
      return program?.metadata?.upcCodes || []
    } catch (error) {
      console.error("Error getting UPC codes:", error)
      return []
    }
  },

  addUpcCodeToProgram: (programId: string, upcCode: string) => {
    if (typeof window === "undefined") return
    try {
      const program = storageService.getProgram(programId)
      if (program) {
        program.metadata = program.metadata || {}
        program.metadata.upcCodes = program.metadata.upcCodes || []
        if (!program.metadata.upcCodes.includes(upcCode)) {
          program.metadata.upcCodes.push(upcCode)
          storageService.saveProgram(program)
        }
      }
    } catch (error) {
      console.error("Error adding UPC code:", error)
    }
  },

  removeUpcCodeFromProgram: (programId: string, upcCode: string) => {
    if (typeof window === "undefined") return
    try {
      const program = storageService.getProgram(programId)
      if (program && program.metadata && program.metadata.upcCodes) {
        program.metadata.upcCodes = program.metadata.upcCodes.filter((code: string) => code !== upcCode)
        storageService.saveProgram(program)
      }
    } catch (error) {
      console.error("Error removing UPC code:", error)
    }
  },

  getMerchantAddress: () => {
    return "1MerchantWalletAddressExample123456"
  },
}

// Inline implementation of useProgramStorage
const useProgramStorage = (initialProgram: Program, initialProducts: Product[], programId: string) => {
  const [program, setProgram] = useState<Program | null>(initialProgram)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [upcCodes, setUpcCodes] = useState<string[]>(initialProgram?.metadata?.upcCodes || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshProgram = () => {
    try {
      const programData = storageService.getProgram(programId)
      if (programData) {
        setProgram(programData)
        setProducts(storageService.getProductsForProgram(programId))
        setUpcCodes(storageService.getUpcCodesForProgram(programId))
      } else {
        setError("Program not found")
      }
    } catch (err) {
      setError("Failed to load program")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return { program, products, upcCodes, isLoading, error, refreshProgram, setProgram, setProducts, setUpcCodes }
}

// Inline implementation of AddUpcCodeForm
const AddUpcCodeForm = ({ programId, onSuccess }: { programId: string; onSuccess: () => void }) => {
  const [upcCode, setUpcCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!upcCode.trim()) return

    setIsSubmitting(true)
    try {
      storageService.addUpcCodeToProgram(programId, upcCode.trim())
      setUpcCode("")
      onSuccess()
    } catch (error) {
      console.error("Error adding UPC code:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="upc">UPC Code</Label>
        <Input id="upc" value={upcCode} onChange={(e) => setUpcCode(e.target.value)} placeholder="Enter UPC code" />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add UPC Code"}
      </Button>
    </form>
  )
}

// Inline implementation of AddProductForm
const AddProductForm = ({ programId, onSuccess }: { programId: string; onSuccess: () => void }) => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    upc: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product.name || !product.description) return

    setIsSubmitting(true)
    try {
      const program = storageService.getProgram(programId)
      if (program) {
        program.metadata = program.metadata || {}
        program.metadata.products = program.metadata.products || []

        const newProduct = {
          id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl || "",
          upc: product.upc || "",
          createdAt: new Date().toISOString(),
        }

        program.metadata.products.push(newProduct)

        // Add UPC code if provided
        if (product.upc) {
          program.metadata.upcCodes = program.metadata.upcCodes || []
          if (!program.metadata.upcCodes.includes(product.upc)) {
            program.metadata.upcCodes.push(product.upc)
          }
        }

        storageService.saveProgram(program)

        setProduct({
          name: "",
          description: "",
          price: "",
          imageUrl: "",
          upc: "",
        })

        onSuccess()
      }
    } catch (error) {
      console.error("Error adding product:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          placeholder="Enter product name"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={product.description}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
          placeholder="Enter product description"
          required
        />
      </div>
      <div>
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          value={product.price}
          onChange={(e) => setProduct({ ...product, price: e.target.value })}
          placeholder="Enter product price"
        />
      </div>
      <div>
        <Label htmlFor="upc">UPC Code (Optional)</Label>
        <Input
          id="upc"
          value={product.upc}
          onChange={(e) => setProduct({ ...product, upc: e.target.value })}
          placeholder="Enter UPC code"
        />
      </div>
      <div>
        <Label htmlFor="imageUrl">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          value={product.imageUrl}
          onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
          placeholder="Enter image URL"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Product"}
      </Button>
    </form>
  )
}

// Main component
export default function ProgramDetailsClient({
  initialProgram,
  initialProducts,
  programId,
}: ProgramDetailsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { program, products, upcCodes, isLoading, error, refreshProgram, setProgram, setProducts, setUpcCodes } =
    useProgramStorage(initialProgram, initialProducts, programId)
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab")
    if (tab && ["overview", "products", "settings", "analytics"].includes(tab)) {
      return tab
    }
    return "overview"
  })
  const [isAddingUpc, setIsAddingUpc] = useState(false)
  const [newUpcCode, setNewUpcCode] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    upc: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showDebug] = useState(() => {
    return searchParams.get("debug") === "true"
  })
  const [debugLogs] = useState<string[]>([])

  // Load UPC codes and products on mount and when program changes
  useEffect(() => {
    if (!program) return

    // First check if the program has UPC codes in its metadata
    let codes: string[] = []

    if (program.metadata?.upcCodes && Array.isArray(program.metadata.upcCodes)) {
      codes = [...program.metadata.upcCodes]
      console.log(`🔍 Found ${codes.length} UPC codes in program metadata: ${codes.join(", ")}`)
    } else {
      console.log(`⚠️ No UPC codes found in program metadata or not an array`)
    }

    // Also get UPC codes from the storage service
    const storageCodes = storageService.getUpcCodesForProgram(program.id)
    console.log(`🔍 Found ${storageCodes.length} UPC codes from storage service: ${storageCodes.join(", ")}`)

    // Merge the codes, removing duplicates using Array.from instead of spread on a Set
    const allCodes = Array.from(new Set([...codes, ...storageCodes]))
    console.log(`🔍 Total UPC codes after merging: ${allCodes.length}: ${allCodes.join(", ")}`)

    setUpcCodes(allCodes)

    // Ensure products are loaded from program metadata
    if (
      program.metadata?.products &&
      Array.isArray(program.metadata.products) &&
      program.metadata.products.length > 0
    ) {
      console.log(`🔍 Found ${program.metadata.products.length} products in program metadata`)

      // Use explicit type annotation for product
      program.metadata.products.forEach((product: Product) => {
        if (product.upc && !allCodes.includes(product.upc)) {
          allCodes.push(product.upc)
          console.log(`➕ Added UPC code ${product.upc} from product in metadata`)
        }
      })

      setProducts(program.metadata.products)
    } else {
      // If no products in metadata, try to get them from storage service
      const storageProducts = storageService.getProductsForProgram(program.id)
      if (storageProducts.length > 0) {
        console.log(`🔍 Found ${storageProducts.length} products from storage service`)

        // Extract UPC codes from storage products
        storageProducts.forEach((product: Product) => {
          if (product.upc && !allCodes.includes(product.upc)) {
            allCodes.push(product.upc)
            console.log(`➕ Added UPC code ${product.upc} from product in storage`)
          }
        })

        setProducts(storageProducts)

        // Update program metadata with these products
        setProgram((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            metadata: {
              ...prev.metadata,
              products: storageProducts,
              upcCodes: allCodes,
            },
          }
        })

        // Save the updated program with UPC codes
        setTimeout(() => saveProgram(), 100)
      } else {
        console.log(`⚠️ No products found for this program`)
      }
    }

    // Update UPC codes with all found codes
    setUpcCodes(allCodes)
  }, [program, programId, products])

  // Log initial data - only once
  useEffect(() => {
    if (program && products) {
      console.log(`🔍 ProgramDetailsClient received products: ${products.length}`)
      console.log(`🔍 ProgramDetailsClient received program: ${program.name}`)

      if (program.metadata?.expirationDate) {
        console.log(`🔍 Program has expiration date: ${program.metadata.expirationDate}`)
      }

      if (program.expirationDate) {
        console.log(`🔍 Program has root expiration date: ${program.expirationDate}`)
      }
    }
  }, [program, products]) // Run when program or products change

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load program details.",
      variant: "destructive",
    })
    return <div>Error loading program details.</div>
  }

  if (!program) {
    toast({
      title: "Error",
      description: "Program not found.",
      variant: "destructive",
    })
    return <div>Program not found.</div>
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/merchant/programs/${program.id}?tab=${value}`, { scroll: false })
  }

  // Helper function to format the expiration date - simple fix
  const formatExpirationDate = (program: Program): string => {
    const dateString = program.metadata?.expirationDate || program.expirationDate
    if (!dateString) return "No expiration date"

    try {
      // Handle simple YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split("-")
        return `${month}/${day}/${year}`
      }

      // Handle ISO format
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US")
      }

      return dateString
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Save program to localStorage - preserve original dates
  const saveProgram = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      console.log("💾 Saving program to localStorage...")

      // Create updated program but preserve original creation date and expiration date
      let updatedProgram = { ...program }

      // Only update the updatedAt field, preserve everything else
      updatedProgram.updatedAt = new Date().toISOString()

      // Ensure UPC codes and products are included in the metadata
      updatedProgram = {
        ...updatedProgram,
        metadata: {
          ...updatedProgram.metadata,
          upcCodes: upcCodes,
          products: products,
        },
      }

      // Save using storage service
      storageService.saveProgram(updatedProgram)
      console.log(`✅ Program saved successfully with ${products.length} products`)

      // Update local state
      setProgram(updatedProgram)

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error saving program:", err)
      setSaveError(err.message || "Error saving program")
    } finally {
      setIsSaving(false)
    }
  }

  // Add UPC code
  const handleAddUpc = () => {
    if (!newUpcCode.trim()) return

    console.log(`➕ Adding UPC code: ${newUpcCode.trim()}`)

    // Add UPC code using storage service
    storageService.addUpcCodeToProgram(program.id, newUpcCode.trim())

    // Update local state
    const updatedUpcCodes = [...upcCodes]
    if (!updatedUpcCodes.includes(newUpcCode.trim())) {
      updatedUpcCodes.push(newUpcCode.trim())
      setUpcCodes(updatedUpcCodes)
    }

    // Update program metadata
    setProgram((prev) => {
      if (!prev) return prev

      const metadata = prev.metadata || {}
      const programUpcCodes = metadata.upcCodes || []

      if (!programUpcCodes.includes(newUpcCode.trim())) {
        return {
          ...prev,
          metadata: {
            ...metadata,
            upcCodes: [...programUpcCodes, newUpcCode.trim()],
          },
        }
      }
      return prev
    })

    // Reset form
    setNewUpcCode("")
    setIsAddingUpc(false)
  }

  // Remove product
  const handleRemoveProduct = (productId: string) => {
    console.log(`🗑️ Removing product with ID: ${productId}`)

    // Remove from products state
    setProducts((prev) => prev.filter((product) => product.id !== productId))
    console.log(`✅ Product removed. Total products: ${products.length - 1}`)

    // Save changes
    setTimeout(() => saveProgram(), 100)
  }

  // NOTE: UPC product selection functionality is planned for future implementation
  // When the UPC Lookup component is added, uncomment and use this function:
  /*
function handleUpcProductSelection(selectedProducts: any[]) {
  // Add UPC codes from selected products
  const newUpcCodes = selectedProducts.map((product) => product.upc)

  // Update UPC codes in program - combine and deduplicate in one step
  const allUpdatedUpcCodes = Array.from(new Set([...upcCodes, ...newUpcCodes]))
  setUpcCodes(allUpdatedUpcCodes)

  // Add products to program
  const productsToAdd = selectedProducts.map((product) => ({
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: product.name,
    description: product.category,
    price: "",
    imageUrl: "",
    upc: product.upc,
    manufacturer: product.manufacturer,
    createdAt: new Date().toISOString(),
  }))

  // Add to products state if not already there
  const updatedProducts = [...products]
  productsToAdd.forEach((product) => {
    if (!products.some((p) => p.upc === product.upc)) {
      updatedProducts.push(product)
    }
  })

  setProducts(updatedProducts)

  // Save changes
  setTimeout(() => saveProgram(), 100)
}
*/

  // NOTE: Copy program functionality is planned for future implementation
  // When the copy button is added to the UI, uncomment and use this function:
  /*
  const handleCopyProgram = () => {
    try {
      // Create a deep copy of the program
      const programCopy = JSON.parse(JSON.stringify(program))

      // Generate a new ID for the copy - ensure it's URL-safe
      programCopy.id = `copy_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)
        .replace(/[^a-z0-9]/g, "")}`

      // Update name to indicate it's a copy
      programCopy.name = `Copy of ${program.name}`

      // Reset creation and update dates
      programCopy.createdAt = new Date().toISOString()
      programCopy.updatedAt = new Date().toISOString()

      // Reset participants
      programCopy.participants = []

      // Set status to Draft by default for copied programs
      programCopy.status = "draft"

      // Normalize dates consistently for all programs
      if (programCopy.metadata?.expirationDate) {
        // Keep the exact date string, don't normalize it
        const exactDate = programCopy.metadata.expirationDate
        programCopy.metadata.expirationDate = exactDate
      }

      if (programCopy.expirationDate) {
        // For the ISO format, ensure we use noon UTC to avoid timezone issues
        const datePart = programCopy.expirationDate.split("T")[0]
        programCopy.expirationDate = `${datePart}T12:00:00.000Z`
      }

      // Save the copied program
      storageService.saveProgram(programCopy)

      // Show success message
      alert(`Program copied successfully! New program ID: ${programCopy.id}`)

      // Redirect to the new program
      router.push(`/merchant/programs/${programCopy.id}`)
    } catch (error) {
      console.error("Error copying program:", error)
      alert("Failed to copy program. Please try again.")
    }
  }
  */

  // Function to ensure products have UPC codes
  const ensureProductUpcCodes = () => {
    if (products.length > 0) {
      let updatedProducts = false
      const updatedUpcCodes = [...upcCodes]

      // Process each product
      const productsWithUpc = products.map((product, index) => {
        // If product doesn't have a UPC code, generate one
        if (!product.upc) {
          // Generate a UPC code based on product name and program
          const productNameHash = product.name
            .split("")
            .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
          const upcCode = `0490${(productNameHash % 10000).toString().padStart(4, "0")}${(index + 1).toString().padStart(4, "0")}`

          // Add to UPC codes list if not already there
          if (!updatedUpcCodes.includes(upcCode)) {
            updatedUpcCodes.push(upcCode)
          }

          updatedProducts = true
          console.log(`Added UPC code ${upcCode} to product ${product.name}`)

          // Return product with UPC code
          return { ...product, upc: upcCode }
        }

        // If product has UPC but it's not in UPC codes list, add it
        if (product.upc && !updatedUpcCodes.includes(product.upc)) {
          updatedUpcCodes.push(product.upc)
          updatedProducts = true
          console.log(`Added existing UPC code ${product.upc} from product ${product.name} to UPC codes list`)
        }

        return product
      })

      // Update state if changes were made
      if (updatedProducts) {
        setProducts(productsWithUpc)
        setUpcCodes(updatedUpcCodes)

        // Update program metadata
        setProgram((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            metadata: {
              ...prev.metadata,
              products: productsWithUpc,
              upcCodes: updatedUpcCodes,
            },
          }
        })

        // Save changes
        setTimeout(() => saveProgram(), 100)
        return true
      }
    }
    return false
  }

  // Add a function to ensure default products exist
  const ensureDefaultProducts = () => {
    if (products.length === 0) {
      // Create default products based on program type
      if (program.name === "Coffee Loyalty Card") {
        const defaultProducts = [
          {
            id: `prod_${Date.now()}_1`,
            name: "Regular Coffee",
            description: "Our signature house blend coffee",
            price: "3.99",
            imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80",
            createdAt: new Date().toISOString(),
          },
          {
            id: `prod_${Date.now()}_2`,
            name: "Cappuccino",
            description: "Espresso with steamed milk and foam",
            price: "4.99",
            imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=500&q=80",
            createdAt: new Date().toISOString(),
          },
        ]

        setProducts(defaultProducts)

        // Update program metadata
        const updatedProgram = {
          ...program,
          metadata: {
            ...program.metadata,
            products: defaultProducts,
          },
        }

        // Save to storage
        storageService.saveProgram(updatedProgram)
        setProgram(updatedProgram)

        console.log(`✅ Added default coffee products to program`)
        return true
      }
    }
    return false
  }

  // Function to handle adding a new product
  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) return

    console.log(`➕ Adding product: ${newProduct.name}`)

    // Create a new product object
    const productToAdd: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      imageUrl: newProduct.imageUrl || "",
      upc: newProduct.upc || "",
      createdAt: new Date().toISOString(),
    }

    // Update local state
    const updatedProducts = [...products, productToAdd]
    setProducts(updatedProducts)

    // Update program metadata
    setProgram((prev) => {
      if (!prev) return prev

      const metadata = prev.metadata || {}
      const programProducts = metadata.products || []

      return {
        ...prev,
        metadata: {
          ...metadata,
          products: [...programProducts, productToAdd],
        },
      }
    })

    // Save changes
    setTimeout(() => saveProgram(), 100)

    // Reset form
    setNewProduct({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      upc: "",
    })
    setIsAddingProduct(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Program Details</h1>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add UPC Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add UPC Code</DialogTitle>
                <DialogDescription>Add a UPC code to the program.</DialogDescription>
              </DialogHeader>
              <AddUpcCodeForm
                programId={programId}
                onSuccess={() => {
                  refreshProgram()
                  toast({
                    title: "Success",
                    description: "UPC code added successfully.",
                  })
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
                <DialogDescription>Add a product to the program.</DialogDescription>
              </DialogHeader>
              <AddProductForm
                programId={programId}
                onSuccess={() => {
                  refreshProgram()
                  toast({
                    title: "Success",
                    description: "Product added successfully.",
                  })
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {saveSuccess && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-600">Changes saved successfully!</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {showDebug && (
        <div className="container mx-auto p-4 mb-4 bg-muted/20 border rounded">
          <h3 className="font-medium mb-2">Debug Log</h3>
          <div className="p-2 bg-muted rounded-md overflow-auto max-h-40 font-mono text-xs">
            {debugLogs.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">Program ID</dt>
                    <dd className="mt-1 font-mono text-xs">{program.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Type</dt>
                    <dd className="mt-1 capitalize">{program.type?.replace(/-/g, " ") || "Unknown"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1 capitalize">{program.status}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Created</dt>
                    <dd className="mt-1">{new Date(program.createdAt).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Last Updated</dt>
                    <dd className="mt-1">{new Date(program.updatedAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discount Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">Discount Type</dt>
                    <dd className="mt-1 capitalize">
                      {program.metadata?.discountType === "percentage" ? "Percentage" : "Fixed Amount"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Discount Value</dt>
                    <dd className="mt-1">
                      {program.metadata?.discountType === "percentage"
                        ? `${program.metadata?.discountAmount}%`
                        : `${program.metadata?.discountAmount}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Expiration Date</dt>
                    <dd className="mt-1">{formatExpirationDate(program)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          {/* Add this at the top of the TabsContent */}
          {products.length === 0 && (
            <Alert className="mb-4">
              <AlertDescription>
                No products found for this program.
                <Button variant="link" className="p-0 h-auto font-normal" onClick={ensureDefaultProducts}>
                  Add default products
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Add this line to call the function */}
          {products.length > 0 && !products.some((p) => p.upc) && ensureProductUpcCodes()}

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product UPC Lookup</CardTitle>
                <CardDescription>Search for products by UPC code or name</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {/* UPCLookup component would go here - simplified for this implementation */}
              <div className="p-4 border rounded bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  UPC Lookup functionality is simplified in this implementation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product UPC Codes</CardTitle>
                <CardDescription>UPC codes for products included in this program</CardDescription>
              </div>
              <div className="flex space-x-2">
                {upcCodes.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    onClick={() => {
                      // Keep only the verified UPC code
                      const verifiedUpc = "706970457638"
                      const incorrectUpcCodes = upcCodes.filter((upc) => upc !== verifiedUpc)

                      // Confirm before removing
                      if (
                        incorrectUpcCodes.length > 0 &&
                        confirm(
                          `Remove ${incorrectUpcCodes.length} incorrect UPC code(s)? Only the verified UPC (${verifiedUpc}) will be kept.`,
                        )
                      ) {
                        // First update the UPC codes in state
                        setUpcCodes([verifiedUpc])

                        // Update the program metadata
                        const updatedProgram = {
                          ...program,
                          metadata: {
                            ...program.metadata,
                            upcCodes: [verifiedUpc],
                            products: products.filter((product) => product.upc === verifiedUpc),
                          },
                        }

                        // Update products state
                        setProducts(products.filter((product) => product.upc === verifiedUpc))

                        // Save the updated program
                        storageService.saveProgram(updatedProgram)
                        setProgram(updatedProgram)

                        // Also explicitly remove each incorrect UPC from storage
                        incorrectUpcCodes.forEach((upc) => {
                          storageService.removeUpcCodeFromProgram(program.id, upc)
                        })

                        // Show success message
                        setSaveSuccess(true)
                        setTimeout(() => setSaveSuccess(false), 3000)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clean Up Incorrect UPCs
                  </Button>
                )}
                <Dialog open={isAddingUpc} onOpenChange={setIsAddingUpc}>
                  <DialogTrigger asChild>
                    <Button type="button" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add UPC Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add UPC Code</DialogTitle>
                      <DialogDescription>
                        Enter the UPC code for a product to include in this program.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="upc-code">UPC Code</Label>
                        <Input
                          id="upc-code"
                          placeholder="Enter UPC code"
                          value={newUpcCode}
                          onChange={(e) => setNewUpcCode(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingUpc(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddUpc}>Add UPC Code</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Add Product Dialog - This uses the isAddingProduct state variable */}
                <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                  <DialogTrigger asChild>
                    <Button type="button" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Product</DialogTitle>
                      <DialogDescription>Enter the details for a product to include in this program.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input
                          id="product-name"
                          placeholder="Enter product name"
                          value={newProduct.name || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-description">Description</Label>
                        <Input
                          id="product-description"
                          placeholder="Enter product description"
                          value={newProduct.description || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-price">Price</Label>
                        <Input
                          id="product-price"
                          placeholder="Enter product price"
                          value={newProduct.price || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-upc">UPC Code (Optional)</Label>
                        <Input
                          id="product-upc"
                          placeholder="Enter UPC code"
                          value={newProduct.upc || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, upc: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-image">Image URL (Optional)</Label>
                        <Input
                          id="product-image"
                          placeholder="Enter image URL"
                          value={newProduct.imageUrl || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingProduct(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddProduct}>Add Product</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {upcCodes.length > 0 ? (
                <div className="grid gap-2">
                  {upcCodes.map((upc: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{upc}</span>
                        {upc === "706970457638" && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProduct(upc)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-muted-foreground"
                    >
                      <rect width="16" height="10" x="4" y="7" rx="1" />
                      <path d="M5 7v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                      <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                    </svg>
                  </div>
                  <h3 className="font-medium">No UPC codes added yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add UPC codes to specify which products this program applies to
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>Manage program settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Settings content goes here.</p>
              <Button type="button" onClick={saveProgram} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="ml-2"
                onClick={() => {
                  try {
                    // Create a deep copy of the program
                    const programCopy = JSON.parse(JSON.stringify(program))

                    // Generate a new ID for the copy - ensure it's URL-safe
                    programCopy.id = `copy_${Date.now()}_${Math.random()
                      .toString(36)
                      .substring(2, 9)
                      .replace(/[^a-z0-9]/g, "")}`

                    // Update name to indicate it's a copy
                    programCopy.name = `Copy of ${program.name}`

                    // Reset creation and update dates
                    programCopy.createdAt = new Date().toISOString()
                    programCopy.updatedAt = new Date().toISOString()

                    // Reset participants
                    programCopy.participants = []

                    // Set status to Draft by default for copied programs
                    programCopy.status = "draft"

                    // Normalize dates consistently for all programs
                    if (programCopy.metadata?.expirationDate) {
                      // Keep the exact date string, don't normalize it
                      const exactDate = programCopy.metadata.expirationDate
                      programCopy.metadata.expirationDate = exactDate
                    }

                    if (programCopy.expirationDate) {
                      // For the ISO format, ensure we use noon UTC to avoid timezone issues
                      const datePart = programCopy.expirationDate.split("T")[0]
                      programCopy.expirationDate = `${datePart}T12:00:00.000Z`
                    }

                    // Save the copied program
                    storageService.saveProgram(programCopy)

                    // Show success message
                    alert(`Program copied successfully! New program ID: ${programCopy.id}`)

                    // Redirect to the new program
                    router.push(`/merchant/programs/${programCopy.id}`)
                  } catch (error) {
                    console.error("Error copying program:", error)
                    alert("Failed to copy program. Please try again.")
                  }
                }}
              >
                Copy Program
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Program Analytics</CardTitle>
              <CardDescription>View program analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Analytics content goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}