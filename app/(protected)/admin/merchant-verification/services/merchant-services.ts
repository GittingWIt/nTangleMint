"use server"

import {
  type MerchantRecord,
  type MerchantQueryFilters,
  type MerchantAnalytics,
  type BSVVerificationRecord,
  type MerchantApplication,
  BusinessCategory,
  BusinessRegion,
  VerificationStatus,
  EmployeeRange,
} from "../types"

// Hybrid Merchant Service: Fast Database + Blockchain Trust
class MerchantService {
  // Fast database queries for UI
  async queryMerchants(filters: MerchantQueryFilters = {}): Promise<MerchantRecord[]> {
    try {
      console.log("[Merchant Service] Querying merchants from database with filters:", filters)

      // TODO: Replace with actual database query (Prisma, Drizzle, etc.)
      // Example: const merchants = await db.merchant.findMany({ where: buildWhereClause(filters) })

      // For testing - this simulates database response time
      await new Promise((resolve) => setTimeout(resolve, 100))

      // TODO: Remove mock data when database is connected
      const mockMerchants: MerchantRecord[] = []

      // Apply filters (in real implementation, this would be SQL WHERE clauses)
      let filtered = mockMerchants

      if (filters.region?.length) {
        filtered = filtered.filter((m) => filters.region!.includes(m.location.region))
      }

      if (filters.businessType?.length) {
        filtered = filtered.filter((m) => filters.businessType!.includes(m.businessType))
      }

      if (filters.verificationStatus?.length) {
        filtered = filtered.filter((m) => filters.verificationStatus!.includes(m.verification.status))
      }

      console.log(`[Merchant Service] Found ${filtered.length} merchants`)
      return filtered
    } catch (error) {
      console.error("[Merchant Service] Error querying merchants:", error)
      throw new Error("Failed to query merchant data")
    }
  }

  // Convert MerchantRecord to MerchantApplication
  async getMerchantApplications(filters: MerchantQueryFilters = {}): Promise<MerchantApplication[]> {
    const merchants = await this.queryMerchants(filters)

    return merchants.map(
      (merchant): MerchantApplication => ({
        id: merchant.id,
        businessName: merchant.businessName,
        applicantName: merchant.contact.applicantName,
        email: merchant.contact.email,
        phone: merchant.contact.phone,
        address: merchant.location.address,
        businessType: merchant.businessType,
        businessDescription: merchant.businessDetails.description,
        website: merchant.contact.website ?? "",
        submittedAt: merchant.verification.submittedAt,
        status: merchant.verification.status,
        priority: merchant.verification.priority,
        documents: merchant.documents,
        notes: merchant.verification.notes ?? "",
        reviewedBy: merchant.verification.reviewedBy ?? "",
        reviewedAt: merchant.verification.reviewedAt ?? "",
        adminNotes: merchant.adminNotes,
      }),
    )
  }

  // Update verification status: Database first, then blockchain
  async updateVerificationStatus(
    merchantId: string,
    status: VerificationStatus,
    reviewedBy: string,
    notes?: string,
  ): Promise<string> {
    try {
      console.log(`[Merchant Service] Updating merchant ${merchantId} status to ${status}`)

      // TODO: Update database immediately (fast UI response)
      // Example: await db.merchant.update({ where: { id: merchantId }, data: { verification: { status, reviewedBy, notes } } })

      // TODO: Get merchant wallet address from database
      const merchantWalletAddress = "TODO_GET_FROM_DATABASE"

      // Create blockchain verification record
      const bsvRecord: BSVVerificationRecord = {
        protocol: "LOYALTY_VERIFY",
        merchantId,
        walletAddress: merchantWalletAddress,
        verificationStatus: status,
        verifiedAt: new Date().toISOString(),
        reviewedBy: reviewedBy,
        businessDataHash: "TODO_CALCULATE_HASH", // TODO: Calculate from current business data
        adminNotes: notes || "",
      }

      const txId = await this.createBSVVerificationTransaction(bsvRecord)

      // TODO: Update database with blockchain transaction reference
      // Example: await db.merchant.update({ where: { id: merchantId }, data: { verificationTxId: txId } })

      console.log(`[Merchant Service] ✅ Verification updated. BSV TX: ${txId}`)
      return txId
    } catch (error) {
      console.error("[Merchant Service] Error updating verification:", error)
      throw new Error("Failed to update merchant verification")
    }
  }

  // Get analytics from database (fast)
  async getMerchantAnalytics(filters: MerchantQueryFilters = {}): Promise<MerchantAnalytics> {
    try {
      const merchants = await this.queryMerchants(filters)

      const analytics: MerchantAnalytics = {
        totalMerchants: merchants.length,
        byRegion: this.groupByRegion(merchants),
        byBusinessType: this.groupByBusinessType(merchants),
        byVerificationStatus: this.groupByVerificationStatus(merchants),
        byEmployeeSize: this.groupByEmployeeSize(merchants),
        averageProcessingTime: this.calculateAverageProcessingTime(merchants),
        topCities: this.getTopCities(merchants),
        monthlyGrowth: this.calculateMonthlyGrowth(merchants),
        conversionRate: this.calculateConversionRate(merchants),
      }

      return analytics
    } catch (error) {
      console.error("[Merchant Service] Error calculating analytics:", error)
      throw new Error("Failed to calculate merchant analytics")
    }
  }

  // Private methods
  private async createBSVVerificationTransaction(record: BSVVerificationRecord): Promise<string> {
    try {
      // TODO: Replace with actual BSV SDK transaction using Rust library
      // This should integrate with your packages/bsv-core Rust package
      // Example implementation:

      // import { createTransaction } from '@/packages/bsv-core'
      // const transaction = await createTransaction({
      //   type: 'MERCHANT_VERIFICATION',
      //   data: record,
      //   network: process.env.BSV_NETWORK || 'testnet' // Use testnet for testing
      // })
      // return transaction.txid

      // For now, simulate the transaction creation
      console.log("[BSV] Creating verification transaction:", record)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // TODO: Remove this mock transaction ID
      return `bsv_verify_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    } catch (error) {
      console.error("[BSV] Error creating verification transaction:", error)
      throw new Error("Failed to create BSV verification transaction")
    }
  }

  private groupByRegion(merchants: MerchantRecord[]): Record<BusinessRegion, number> {
    const grouped = {} as Record<BusinessRegion, number>
    Object.values(BusinessRegion).forEach((region) => {
      grouped[region] = 0
    })
    merchants.forEach((m) => {
      grouped[m.location.region]++
    })
    return grouped
  }

  private groupByBusinessType(merchants: MerchantRecord[]): Record<BusinessCategory, number> {
    const grouped = {} as Record<BusinessCategory, number>
    Object.values(BusinessCategory).forEach((type) => {
      grouped[type] = 0
    })
    merchants.forEach((m) => {
      grouped[m.businessType]++
    })
    return grouped
  }

  private groupByVerificationStatus(merchants: MerchantRecord[]): Record<VerificationStatus, number> {
    const grouped = {} as Record<VerificationStatus, number>
    Object.values(VerificationStatus).forEach((status) => {
      grouped[status] = 0
    })
    merchants.forEach((m) => {
      grouped[m.verification.status]++
    })
    return grouped
  }

  private groupByEmployeeSize(merchants: MerchantRecord[]): Record<EmployeeRange, number> {
    const grouped = {} as Record<EmployeeRange, number>
    Object.values(EmployeeRange).forEach((size) => {
      grouped[size] = 0
    })
    merchants.forEach((m) => {
      if (m.businessDetails.employeeCount) {
        grouped[m.businessDetails.employeeCount]++
      }
    })
    return grouped
  }

  private calculateAverageProcessingTime(merchants: MerchantRecord[]): number {
    const processed = merchants.filter(
      (m) =>
        m.verification.reviewedAt &&
        (m.verification.status === VerificationStatus.APPROVED ||
          m.verification.status === VerificationStatus.REJECTED),
    )

    if (processed.length === 0) return 0

    const totalDays = processed.reduce((sum, m) => {
      const submitted = new Date(m.verification.submittedAt)
      const reviewed = new Date(m.verification.reviewedAt!)
      const days = (reviewed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
      return sum + days
    }, 0)

    return Math.round((totalDays / processed.length) * 10) / 10
  }

  private getTopCities(merchants: MerchantRecord[]): Array<{ city: string; count: number }> {
    const cityCount = new Map<string, number>()
    merchants.forEach((m) => {
      const city = m.location.city
      cityCount.set(city, (cityCount.get(city) || 0) + 1)
    })

    return Array.from(cityCount.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private calculateMonthlyGrowth(merchants: MerchantRecord[]): Array<{ month: string; newMerchants: number }> {
    const monthlyCount = new Map<string, number>()
    merchants.forEach((m) => {
      const date = new Date(m.verification.submittedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyCount.set(monthKey, (monthlyCount.get(monthKey) || 0) + 1)
    })

    return Array.from(monthlyCount.entries())
      .map(([month, newMerchants]) => ({ month, newMerchants }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private calculateConversionRate(merchants: MerchantRecord[]): number {
    const total = merchants.length
    const approved = merchants.filter((m) => m.verification.status === VerificationStatus.APPROVED).length
    return total > 0 ? Math.round((approved / total) * 100 * 10) / 10 : 0
  }
}

// Export singleton instance
export const merchantService = new MerchantService()

// Server Actions for Next.js
export async function queryMerchantsAction(filters: MerchantQueryFilters) {
  return await merchantService.queryMerchants(filters)
}

export async function getMerchantApplicationsAction(filters: MerchantQueryFilters) {
  return await merchantService.getMerchantApplications(filters)
}

export async function getMerchantAnalyticsAction(filters: MerchantQueryFilters = {}) {
  return await merchantService.getMerchantAnalytics(filters)
}

export async function updateMerchantVerificationAction(
  merchantId: string,
  status: VerificationStatus,
  reviewedBy: string,
  notes?: string,
) {
  return await merchantService.updateVerificationStatus(merchantId, status, reviewedBy, notes)
}