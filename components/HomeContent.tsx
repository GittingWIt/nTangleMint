"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getWalletData } from "@/lib/storage-compat"
// Change the import line to only import functions that exist
import { getPrograms } from "@/lib/utils/program-utils"
import type { WalletData } from "@/types"
import { WelcomeSection } from "./WelcomeSection"
// First, ensure the import is correct
import ProgramsList from "./ProgramsList"

// Define Program type inline until we establish the correct import location
type ProgramType = "punch-card" | "points" | "tiered" | "coalition"

// Then update the ExtendedProgram interface to match what's used in ProgramsList
interface ExtendedProgram {
  id: string
  name: string
  businessName?: string
  description?: string
  type: ProgramType
  category?: string
  participants: string[]
  pointsPerReward?: number
}

const programTypes = [
  { value: "all", label: "All Types" },
  { value: "punch-card", label: "Punch Card" },
  { value: "points", label: "Points" },
  { value: "tiered", label: "Tiered" },
  { value: "coalition", label: "Coalition" },
] as const

type ProgramTypeValue = (typeof programTypes)[number]["value"]

const categories = ["All", "Food & Beverage", "Retail", "Health & Fitness", "Multi-merchant"] as const

export default function HomeContent() {
  const router = useRouter()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>("All")
  const [selectedType, setSelectedType] = useState<ProgramTypeValue>("all")
  const [allPrograms, setAllPrograms] = useState<ExtendedProgram[]>([])
  const [joinedPrograms, setJoinedPrograms] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Function to load coupons
  const loadCoupons = useCallback(() => {
    try {
      // Get coupon programs
      // const couponPrograms = storageService.getCouponPrograms()
      // debug("Coupon programs:", couponPrograms.length)
      // If no coupons found, add a default one
      // if (couponPrograms.length === 0) {
      //   const added = storageService.ensureDefaultCoupons()
      //   if (added) {
      //     // Try again after adding default coupon
      //     const updatedPrograms = storageService.getCouponPrograms()
      //     if (updatedPrograms.length > 0) {
      //       const couponItems = updatedPrograms.map(programToCoupon)
      //       setCoupons(couponItems)
      //       return
      //     }
      //   }
      //   // If still no coupons, create a manual one just for display
      //   const manualCoupon = storageService.createManualCoupon()
      //   const couponItem = programToCoupon(manualCoupon)
      //   setCoupons([couponItem])
      //   if (SHOW_DEBUG) {
      //     setDebugMessage("No coupons found in storage, added manual coupon")
      //   }
      // } else {
      //   // Convert to coupon format
      //   const couponItems = couponPrograms.map(programToCoupon)
      //   setCoupons(couponItems)
      // }
    } catch (error) {
      console.error("Error loading coupons:", error)

      // Add manual coupon as fallback
      // const manualCoupon = storageService.createManualCoupon()
      // const couponItem = programToCoupon(manualCoupon)
      // setCoupons([couponItem])

      // if (SHOW_DEBUG) {
      //   setDebugMessage("Error loading coupons, added manual coupon as fallback")
      // }
    }
  }, [])

  // Function to load clipped coupons
  const loadClippedCoupons = useCallback(() => {
    // if (!userData?.wallet?.publicAddress) return

    try {
      // const userCouponsKey = `user-coupons-${userData.wallet.publicAddress}`
      // const couponsStr = localStorage.getItem(userCouponsKey) || "[]"
      // const userCoupons = JSON.parse(couponsStr)
      // console.log("Loaded clipped coupons:", userCoupons.length)
      // Extract just the IDs for easy checking
      // const couponIds = userCoupons.map((c: any) => c.id)
      // setClippedCoupons(couponIds)
    } catch (error) {
      console.error("Error loading clipped coupons:", error)
      // setClippedCoupons([])
    }
  }, [])

  // Handle program interaction based on user type
  const handleProgramInteraction = (program: ExtendedProgram) => {
    if (!walletData) {
      router.push("/wallet-generation")
      return
    }

    // If user is a merchant, navigate to program details instead of joining
    if (walletData.type === "merchant") {
      router.push(`/merchant/programs/${program.id}`)
      return
    }

    // For customers, handle joining the program
    try {
      const existingProgram = allPrograms.find(
        (p) =>
          p.id !== program.id &&
          p.businessName?.toLowerCase() === program.businessName?.toLowerCase() &&
          joinedPrograms.includes(p.id),
      )

      if (existingProgram) {
        setError("You have already joined a program from this business")
        return
      }

      // Since joinProgram doesn't exist, we'll update the program directly
      const programToUpdate = allPrograms.find((p) => p.id === program.id)
      if (programToUpdate && walletData.publicAddress) {
        // Add user to participants
        const updatedParticipants = [...(programToUpdate.participants || []), walletData.publicAddress]

        // Update UI state
        setAllPrograms((prev) =>
          prev.map((p) => {
            if (p.id === program.id) {
              return { ...p, participants: updatedParticipants }
            }
            return p
          }),
        )
        setJoinedPrograms((prev) => [...prev, program.id])
        setError(null)
      } else {
        setError("Failed to join program")
      }
    } catch (err) {
      console.error("Error joining program:", err)
      setError(err instanceof Error ? err.message : "Failed to join program")
    }
  }

  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        const data = await getWalletData()
        setWalletData(data)

        const programs = getPrograms()

        // Convert the programs to ExtendedProgram type
        const extendedPrograms: ExtendedProgram[] = Array.isArray(programs)
          ? programs.map((p) => ({
              ...p,
              participants: p.participants || [], // Use existing participants or empty array
              type: p.type as ProgramType,
            }))
          : []

        setAllPrograms(extendedPrograms)

        // Fix the type comparison issue by checking if data exists and has a publicAddress
        // Instead of comparing the type directly, we'll just check if it's not a merchant
        if (data?.publicAddress && data.type !== "merchant" && data.type !== "customer" && data.type !== "unknown") {
          // Since getUserParticipation doesn't exist, we'll check program participants directly
          const joinedProgramIds = extendedPrograms
            .filter(
              (program) =>
                program.participants &&
                Array.isArray(program.participants) &&
                program.participants.includes(data.publicAddress),
            )
            .map((program) => program.id)

          setJoinedPrograms(joinedProgramIds)
        }
      } catch (error) {
        console.error("Error checking wallet status:", error)
        setError(error instanceof Error ? error.message : "Failed to check wallet status")
        setWalletData(null)
        setJoinedPrograms([])
      } finally {
        // setIsLoading(false)
      }
    }

    checkWalletStatus()
    window.addEventListener("walletUpdated", checkWalletStatus)
    return () => window.removeEventListener("walletUpdated", checkWalletStatus)
  }, [])

  const filteredPrograms = allPrograms.filter((program) => {
    const search = searchTerm.toLowerCase().trim()

    const searchableContent = [program.name, program.businessName, program.description, program.type, program.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    const matchesSearch = search === "" || search.split(" ").every((term) => searchableContent.includes(term))

    const matchesCategory = selectedCategory === "All" || program.category === selectedCategory
    const matchesType = selectedType === "all" || program.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  // Then in the useEffect where you load data, add this:
  useEffect(() => {
    const loadData = async () => {
      try {
        // Force program recognition to ensure all programs are properly typed
        // await forceProgramRecognition()

        // Synchronize programs and coupons to ensure consistency
        // syncProgramsAndCoupons()

        // Ensure we have default coupons and punch cards
        // storageService.ensureDefaultCoupons()
        // Ensure default punch cards (if this function exists in storage-service)
        // storageService.ensureDefaultPunchCards()

        // Load wallet data
        const walletData = await getWalletData()
        if (walletData?.type) {
          // setUserData({
          //   type: walletData.type,
          //   wallet: walletData,
          // })
        } else {
          // setUserData(null)
        }

        // Load programs
        const allPrograms = getPrograms()

        // Convert the programs to ExtendedProgram type
        const extendedPrograms: ExtendedProgram[] = Array.isArray(allPrograms)
          ? allPrograms.map((p) => ({
              ...p,
              participants: p.participants || [], // Use existing participants or empty array
              type: p.type as ProgramType,
            }))
          : []

        setAllPrograms(extendedPrograms)

        // Load coupons
        loadCoupons()
      } catch (error) {
        console.error("Error loading data:", error)
        // setUserData(null)
        setAllPrograms([])

        // Add manual coupon as fallback
        // const manualCoupon = storageService.createManualCoupon()
        // const couponItem = programToCoupon(manualCoupon)
        // setCoupons([couponItem])
      } finally {
        // setIsLoading(false)
      }
    }

    loadData()

    // Listen for the custom couponFound event
    const handleCouponFound = () => {
      // const { coupon } = event.detail
      // debug("Coupon found event received:", coupon)
      // Convert to coupon format and add to state
      // const couponItem = programToCoupon(coupon)
      // setCoupons((prev) => {
      //   // Check if this coupon is already in the state
      //   const exists = prev.some((c) => c.id === couponItem.id)
      //   if (exists) {
      //     return prev
      //   }
      //   return [...prev, couponItem]
      // })
    }

    window.addEventListener("couponFound", handleCouponFound as EventListener)

    return () => {
      window.removeEventListener("couponFound", handleCouponFound as EventListener)
    }
  }, [loadCoupons])

  // Load clipped coupons when userData changes
  useEffect(() => {
    // if (userData?.wallet?.publicAddress) {
    loadClippedCoupons()
    // }
  }, [loadClippedCoupons])

  return (
    <>
      <WelcomeSection walletData={walletData} />

      {error && <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">{error}</div>}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {walletData?.type === "merchant" ? "Browse Programs" : "Discover Loyalty Programs"}
        </h2>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by program name, type, business, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as ProgramTypeValue)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              {programTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex space-x-4 pb-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <ProgramsList
          programs={filteredPrograms}
          walletData={walletData}
          joinedPrograms={joinedPrograms}
          onJoinProgram={handleProgramInteraction}
          isMerchant={walletData?.type === "merchant"}
        />
      </div>
    </>
  )
}