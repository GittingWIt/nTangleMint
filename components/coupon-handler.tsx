"use client"

import { useState, useEffect, useRef } from "react"
import { debugLog } from "@/lib/debug"

interface CouponHandlerProps {
  programId: string
  onCouponRedeemed?: (couponId: string) => void
  onError?: (error: string) => void
}

interface CouponData {
  id: string
  title: string
  description: string
  discount: string
  expiryDate: string
  isRedeemed: boolean
  merchantId: string
  terms?: string
  category?: string
  requiredTransactions: number
  currentTransactions?: number
}

interface TransactionMetadata {
  transactionId: string
  timestamp: string
  amount: number
  merchantId: string
  programId: string
  isEligible: boolean
}

export function CouponHandler({ programId, onCouponRedeemed, onError }: CouponHandlerProps) {
  const [coupons, setCoupons] = useState<CouponData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [transactionMetadata, setTransactionMetadata] = useState<TransactionMetadata[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    loadCoupons()
    loadTransactionMetadata()
  }, [programId])

  const loadTransactionMetadata = async () => {
    try {
      debugLog("program-participation", `Loading transaction metadata for program: ${programId}`)

      // TODO: Replace with BSV blockchain transaction metadata retrieval
      // This should query the BSV blockchain for all transactions associated with the program
      // and filter for eligible transactions based on program rules
      // const metadata = await bsvCore.getTransactionMetadata(programId, customerWallet)

      // Mock transaction metadata for now
      const mockMetadata: TransactionMetadata[] = [
        {
          transactionId: "tx_001",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 25.5,
          merchantId: programId,
          programId: programId,
          isEligible: true,
        },
        {
          transactionId: "tx_002",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 15.75,
          merchantId: programId,
          programId: programId,
          isEligible: true,
        },
        {
          transactionId: "tx_003",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 8.25,
          merchantId: programId,
          programId: programId,
          isEligible: false, // Example: amount too low
        },
      ]

      if (mountedRef.current) {
        setTransactionMetadata(mockMetadata)
        debugLog("program-participation", `Loaded ${mockMetadata.length} transaction metadata records`)
      }
    } catch (err) {
      debugLog("program-participation", "Error loading transaction metadata", err, "error")
    }
  }

  const getEligibleTransactionCount = (): number => {
    // TODO: Replace with actual BSV blockchain logic
    // This should count eligible transactions based on program-specific rules
    // such as minimum amount, time window, merchant verification, etc.
    return transactionMetadata.filter((tx) => tx.isEligible && tx.programId === programId).length
  }

  const loadCoupons = async () => {
    try {
      setLoading(true)
      setError(null)

      debugLog("program-participation", `Loading coupons for program: ${programId}`)

      // TODO: Replace with BSV blockchain coupon retrieval
      // This should query the BSV blockchain for coupons associated with the program
      // const coupons = await bsvCore.getCouponsForProgram(programId)

      // Mock data for now - replace with actual BSV blockchain query
      const mockCoupons: CouponData[] = [
        {
          id: `coupon_${programId}_1`,
          title: "20% Off Next Purchase",
          description: "Get 20% off your next purchase after 3 qualifying transactions",
          discount: "20%",
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isRedeemed: false,
          merchantId: programId,
          terms: "Valid for one-time use. Requires 3 qualifying transactions of $10 or more.",
          category: "discount",
          requiredTransactions: 3,
          currentTransactions: 0,
        },
        {
          id: `coupon_${programId}_2`,
          title: "Buy One Get One Free",
          description: "Purchase any item and get a second item free after 5 qualifying transactions",
          discount: "BOGO",
          expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          isRedeemed: false,
          merchantId: programId,
          terms: "Second item must be of equal or lesser value. Requires 5 qualifying transactions.",
          category: "bogo",
          requiredTransactions: 5,
          currentTransactions: 0,
        },
      ]

      // Update current transaction counts
      const eligibleCount = getEligibleTransactionCount()
      const updatedCoupons = mockCoupons.map((coupon) => ({
        ...coupon,
        currentTransactions: eligibleCount,
      }))

      if (mountedRef.current) {
        setCoupons(updatedCoupons)
        debugLog("program-participation", `Loaded ${updatedCoupons.length} coupons for program ${programId}`)
      }
    } catch (err) {
      debugLog("program-participation", "Error loading coupons", err, "error")
      const errorMessage = err instanceof Error ? err.message : "Failed to load coupons"

      if (mountedRef.current) {
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const redeemCoupon = async (couponId: string) => {
    try {
      setRedeeming(couponId)
      debugLog("program-participation", `Redeeming coupon: ${couponId}`)

      const coupon = coupons.find((c) => c.id === couponId)
      if (!coupon) {
        throw new Error("Coupon not found")
      }

      const eligibleTransactions = getEligibleTransactionCount()
      if (eligibleTransactions < coupon.requiredTransactions) {
        throw new Error(
          `Insufficient qualifying transactions. Need ${coupon.requiredTransactions}, have ${eligibleTransactions}`,
        )
      }

      // TODO: Replace with BSV blockchain coupon redemption
      // This should:
      // 1. Verify the customer has the required number of eligible transactions
      // 2. Create a BSV transaction to mark the coupon as redeemed
      // 3. Update the program's coupon state on the blockchain
      // 4. Record the redemption timestamp and customer wallet
      // 5. Notify the merchant of the redemption
      // const redemptionTx = await bsvCore.redeemCoupon(couponId, customerWallet, eligibleTransactions)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock redemption for now
      setCoupons((prev) => prev.map((c) => (c.id === couponId ? { ...c, isRedeemed: true } : c)))

      onCouponRedeemed?.(couponId)
      debugLog("program-participation", `Coupon redeemed successfully: ${couponId}`)
    } catch (err) {
      debugLog("program-participation", "Error redeeming coupon", err, "error")
      const errorMessage = err instanceof Error ? err.message : "Failed to redeem coupon"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setRedeeming(null)
    }
  }

  const refreshCoupons = () => {
    loadCoupons()
    loadTransactionMetadata()
  }

  const getDiscountDisplay = (discount: string) => {
    if (discount === "BOGO") return "Buy One Get One"
    if (discount.includes("%")) return discount + " Off"
    return discount
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading coupons...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading coupons</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={refreshCoupons}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Available Coupons</h3>
          <p className="text-sm text-gray-500 mt-1">
            {coupons.filter((c) => !c.isRedeemed && !isExpired(c.expiryDate)).length} active coupons
          </p>
        </div>
        <button
          onClick={refreshCoupons}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No coupons available</h3>
          <p className="mt-1 text-sm text-gray-500">Check back later for new offers from this merchant.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon.expiryDate)
            const hasEnoughTransactions = (coupon.currentTransactions || 0) >= coupon.requiredTransactions
            const canRedeem = !coupon.isRedeemed && !expired && hasEnoughTransactions
            const progressPercentage = getProgressPercentage(
              coupon.currentTransactions || 0,
              coupon.requiredTransactions,
            )

            return (
              <div
                key={coupon.id}
                className={`p-6 border rounded-lg transition-all ${
                  coupon.isRedeemed || expired
                    ? "bg-gray-50 border-gray-200 opacity-60"
                    : canRedeem
                      ? "bg-white border-green-200 hover:border-green-300 hover:shadow-md"
                      : "bg-white border-blue-200 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{coupon.title}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {getDiscountDisplay(coupon.discount)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{coupon.description}</p>

                    {/* Transaction Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          Progress: {coupon.currentTransactions || 0} / {coupon.requiredTransactions} transactions
                        </span>
                        <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            hasEnoughTransactions ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {coupon.terms && <p className="text-xs text-gray-500 mb-3 italic">{coupon.terms}</p>}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                      {expired && <span className="text-red-500 font-medium">Expired</span>}
                      {!hasEnoughTransactions && !expired && (
                        <span className="text-orange-500 font-medium">
                          Need {coupon.requiredTransactions - (coupon.currentTransactions || 0)} more transactions
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex-shrink-0">
                    {coupon.isRedeemed ? (
                      <span className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Redeemed
                      </span>
                    ) : expired ? (
                      <span className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-md">
                        Expired
                      </span>
                    ) : canRedeem ? (
                      <button
                        onClick={() => redeemCoupon(coupon.id)}
                        disabled={redeeming === coupon.id}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {redeeming === coupon.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Redeeming...
                          </>
                        ) : (
                          "Redeem Now"
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-3 py-2 bg-orange-100 text-orange-800 text-sm font-medium rounded-md">
                        {coupon.requiredTransactions - (coupon.currentTransactions || 0)} more needed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}