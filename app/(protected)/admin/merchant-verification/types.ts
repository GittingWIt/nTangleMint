// Merchant Verification System Types
// Comprehensive type definitions for merchant onboarding and verification

export enum BusinessCategory {
  FOOD_BEVERAGE = "food_beverage",
  RETAIL = "retail",
  SERVICES = "services",
  HEALTHCARE = "healthcare",
  AUTOMOTIVE = "automotive",
  BEAUTY_WELLNESS = "beauty_wellness",
  FITNESS = "fitness",
  ENTERTAINMENT = "entertainment",
  EDUCATION = "education",
  TECHNOLOGY = "technology",
  OTHER = "other",
}

export enum BusinessRegion {
  NORTHEAST = "northeast",
  SOUTHEAST = "southeast",
  MIDWEST = "midwest",
  SOUTHWEST = "southwest",
  WEST = "west",
  INTERNATIONAL = "international",
}

export enum VerificationStatus {
  PENDING = "pending",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}

export enum EmployeeRange {
  SOLO = "1",
  SMALL = "2-10",
  MEDIUM = "11-50",
  LARGE = "51-200",
  ENTERPRISE = "200+",
}

export enum VerificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Document verification types
export interface DocumentStatus {
  uploaded: boolean
  verified: boolean
  fileUrl?: string
  rejectionReason?: string
  verifiedAt?: string
}

export interface MerchantDocuments {
  businessLicense: DocumentStatus
  identityVerification: DocumentStatus
}

// Location and contact information
export interface BusinessLocation {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  coordinates?: {
    lat: number
    lng: number
  }
  region: BusinessRegion
}

export interface ContactInformation {
  applicantName: string
  email: string
  phone: string
  website?: string
}

// Admin notes and tracking
export interface AdminNote {
  id: string
  author: string
  content: string
  timestamp: string
  type: "note" | "status_change" | "document_review"
}

// Verification tracking
export interface VerificationInfo {
  status: VerificationStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  priority: VerificationPriority
  notes?: string
}

// Business details
export interface BusinessDetails {
  description: string
  yearEstablished: number
  employeeCount: EmployeeRange
}

// Platform integration info
export interface PlatformInfo {
  version: string
  features: string[]
  onboardingCompleted: boolean
  programsCreated: number
  customersServed: number
}

// Main merchant record
export interface MerchantRecord {
  id: string
  walletAddress: string
  businessName: string
  businessType: BusinessCategory
  businessSubtype: string
  location: BusinessLocation
  contact: ContactInformation
  verification: VerificationInfo
  businessDetails: BusinessDetails
  documents: MerchantDocuments
  adminNotes: AdminNote[]
  platform: PlatformInfo
  businessDataHash: string
  createdAt: string
  updatedAt: string
}

// Query filters for merchant search
export interface MerchantQueryFilters {
  region?: BusinessRegion[]
  businessType?: BusinessCategory[]
  verificationStatus?: VerificationStatus[]
  employeeSize?: EmployeeRange[]
  submittedAfter?: string
  submittedBefore?: string
  searchTerm?: string
}

// Analytics aggregations
export interface MerchantAnalytics {
  totalMerchants: number
  byRegion: Record<BusinessRegion, number>
  byBusinessType: Record<BusinessCategory, number>
  byVerificationStatus: Record<VerificationStatus, number>
  byEmployeeSize: Record<EmployeeRange, number>
  averageProcessingTime: number
  topCities: Array<{ city: string; count: number }>
  monthlyGrowth: Array<{ month: string; newMerchants: number }>
  conversionRate: number
}

// BSV blockchain verification record
export interface BSVVerificationRecord {
  protocol: string
  merchantId: string
  walletAddress: string
  verificationStatus: VerificationStatus
  verifiedAt: string
  reviewedBy: string
  businessDataHash: string
  adminNotes?: string
}

// Application view (simplified for admin UI)
export interface MerchantApplication {
  id: string
  businessName: string
  applicantName: string
  email: string
  phone: string
  address: string
  businessType: BusinessCategory
  businessDescription: string
  website: string
  submittedAt: string
  status: VerificationStatus
  priority: VerificationPriority
  documents: MerchantDocuments
  notes: string
  reviewedBy: string
  reviewedAt: string
  adminNotes: AdminNote[]
}