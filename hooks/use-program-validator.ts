'use client'

import type { Wallet } from '@/lib/types'
import { BITCOIN_DUST_LIMIT } from '@/lib/constants'

export interface ValidationReport {
  isValid: boolean
  timestamp: string
  summary: string
  sections: {
    wallet: ValidationSection
    formData: ValidationSection
    blockchain: ValidationSection
    financials: ValidationSection
  }
  issues: string[]
  warnings: string[]
}

export interface ValidationSection {
  status: 'success' | 'warning' | 'error'
  message: string
  details: Record<string, any>
}

export interface FormDataToValidate {
  name?: string
  description?: string
  requiredPunches?: string | number
  satoshisPerPunch?: string | number
  expirationDate?: string
  termsConditions?: string
  registrationFee?: string | number
}

/**
 * Main validation function - checks all prerequisites for program creation
 */
export function validateProgramCreation(
  wallet: Wallet | null | undefined,
  formData: FormDataToValidate,
  blockHeight: number,
  bsvBalance: { total: number } | null,
  registrationFee: number = 1000
): ValidationReport {
  const report: ValidationReport = {
    isValid: true,
    timestamp: new Date().toISOString(),
    summary: '',
    sections: {
      wallet: { status: 'success', message: '', details: {} },
      formData: { status: 'success', message: '', details: {} },
      blockchain: { status: 'success', message: '', details: {} },
      financials: { status: 'success', message: '', details: {} }
    },
    issues: [],
    warnings: []
  }

  // ===== WALLET VALIDATION =====
  console.log('[v0] Validating wallet...')
  
  if (!wallet) {
    report.sections.wallet.status = 'error'
    report.sections.wallet.message = 'No wallet connected'
    report.issues.push('Wallet not connected')
    report.isValid = false
  } else {
    report.sections.wallet.details = {
      publicAddress: wallet.publicAddress,
      hasPrivateKey: !!wallet.privateKey,
      hasBalance: !!wallet.balance,
      connected: true
    }
    
    if (!wallet.publicAddress) {
      report.issues.push('Wallet missing public address')
      report.isValid = false
    }
    if (!wallet.privateKey) {
      report.warnings.push('Wallet missing private key (may not be needed for this operation)')
    }
  }
  console.log('[v0] Wallet validation:', report.sections.wallet)

  // ===== FORM DATA VALIDATION =====
  console.log('[v0] Validating form data...')
  
  const formValidation: Record<string, any> = {}
  
  if (!formData.name || formData.name.trim().length === 0) {
    report.issues.push('Program name is required')
    report.isValid = false
    formValidation.name = 'MISSING'
  } else {
    formValidation.name = `✓ ${formData.name} (${formData.name.length} chars)`
  }

  if (!formData.requiredPunches) {
    report.issues.push('Required punches is required')
    report.isValid = false
    formValidation.requiredPunches = 'MISSING'
  } else {
    const punches = Number(formData.requiredPunches)
    if (isNaN(punches) || punches <= 0) {
      report.issues.push('Required punches must be a positive number')
      report.isValid = false
      formValidation.requiredPunches = 'INVALID'
    } else {
      formValidation.requiredPunches = `✓ ${punches} punches`
    }
  }

  if (!formData.satoshisPerPunch) {
    report.issues.push('Satoshis per punch is required')
    report.isValid = false
    formValidation.satoshisPerPunch = 'MISSING'
  } else {
    const satoshis = Number(formData.satoshisPerPunch)
    if (isNaN(satoshis) || satoshis < 0) {
      report.issues.push('Satoshis per punch must be a valid number')
      report.isValid = false
      formValidation.satoshisPerPunch = 'INVALID'
    } else {
      formValidation.satoshisPerPunch = `✓ ${satoshis} satoshis`
    }
  }

  if (!formData.expirationDate) {
    report.issues.push('Expiration date is required')
    report.isValid = false
    formValidation.expirationDate = 'MISSING'
  } else {
    try {
      // Handle MM/DD/YYYY format from date picker
      const dateStr = formData.expirationDate
      let expDate: Date
      
      if (dateStr.includes('/')) {
        // MM/DD/YYYY format
        const [month, day, year] = dateStr.split('/').map(Number)
        expDate = new Date(year, month - 1, day)
      } else {
        // YYYY-MM-DD or other ISO format
        expDate = new Date(dateStr)
      }
      
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time for fair comparison
      expDate.setHours(0, 0, 0, 0)
      
      if (expDate <= today) {
        report.issues.push(`Expiration date (${dateStr}) must be in the future (today is ${today.toLocaleDateString()})`)
        report.isValid = false
        formValidation.expirationDate = 'INVALID (past date)'
      } else {
        const daysUntil = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        formValidation.expirationDate = `✓ ${dateStr} (${daysUntil} days from now)`
      }
    } catch (error) {
      report.issues.push(`Invalid expiration date format: ${formData.expirationDate}`)
      report.isValid = false
      formValidation.expirationDate = 'INVALID (parse error)'
    }
  }

  report.sections.formData.details = formValidation
  report.sections.formData.status = report.isValid ? 'success' : 'error'
  report.sections.formData.message = Object.keys(formValidation).length > 0 ? 'Form validation complete' : 'No form data provided'
  console.log('[v0] Form validation:', report.sections.formData)

  // ===== BLOCKCHAIN VALIDATION =====
  console.log('[v0] Validating blockchain state...')
  
  const blockchainDetails = {
    blockHeight: blockHeight || 'UNKNOWN',
    blockHeightReady: blockHeight > 0
  }

  if (blockHeight <= 0) {
    report.warnings.push('Block height not loaded - blockchain may not be ready')
    report.sections.blockchain.status = 'warning'
  } else {
    report.sections.blockchain.status = 'success'
  }

  report.sections.blockchain.details = blockchainDetails
  report.sections.blockchain.message = `Block height: ${blockHeight}`
  console.log('[v0] Blockchain validation:', report.sections.blockchain)

  // ===== FINANCIAL VALIDATION =====
  console.log('[v0] Validating financials...')
  
  const balance = bsvBalance?.total || 0
  const requiredPunches = Number(formData.requiredPunches) || 0
  const satoshisPerPunch = Number(formData.satoshisPerPunch) || 0
  const totalPunchCost = requiredPunches * satoshisPerPunch
  const totalRequired = registrationFee + totalPunchCost

  const financialDetails = {
    walletBalance: `${balance} satoshis`,
    registrationFee: `${registrationFee} satoshis`,
    totalPunchCost: `${totalPunchCost} satoshis (${requiredPunches} × ${satoshisPerPunch})`,
    totalRequired: `${totalRequired} satoshis`,
    hasSufficientBalance: balance >= totalRequired,
    dustLimitCompliant: satoshisPerPunch >= BITCOIN_DUST_LIMIT,
    balanceMargin: `${balance - totalRequired} satoshis remaining`
  }

  if (balance < totalRequired) {
    report.issues.push(`Insufficient balance: need ${totalRequired} satoshis, have ${balance}`)
    report.isValid = false
    report.sections.financials.status = 'error'
  } else {
    report.sections.financials.status = 'success'
  }

  if (satoshisPerPunch < BITCOIN_DUST_LIMIT) {
    report.warnings.push(`Satoshis per punch (${satoshisPerPunch}) is below dust limit (${BITCOIN_DUST_LIMIT})`)
    report.sections.financials.status = 'warning'
  }

  report.sections.financials.details = financialDetails
  report.sections.financials.message = `Financial check: ${report.isValid ? 'PASS' : 'FAIL'}`
  console.log('[v0] Financial validation:', report.sections.financials)

  // ===== SUMMARY =====
  if (report.isValid) {
    report.summary = '✓ ALL CHECKS PASSED - Safe to create program'
    console.log('%c[v0] VALIDATION RESULT: PASS', 'color: green; font-weight: bold; font-size: 14px')
  } else {
    report.summary = `✗ VALIDATION FAILED - ${report.issues.length} issue(s) found`
    console.log('%c[v0] VALIDATION RESULT: FAIL', 'color: red; font-weight: bold; font-size: 14px')
    console.log('%cIssues:', 'font-weight: bold', report.issues)
  }

  if (report.warnings.length > 0) {
    console.log('%cWarnings:', 'font-weight: bold; color: orange', report.warnings)
  }

  console.log('[v0] Full report:', report)
  return report
}

// ===== EXPOSE TO WINDOW FOR CONSOLE ACCESS =====
if (typeof window !== 'undefined') {
  ;(window as any).validateProgram = validateProgramCreation
  
  // Also expose a simpler version that tries to auto-detect form data
  ;(window as any).quickValidate = () => {
    console.log('[v0] Running quick validation...')
    console.log('[v0] Tip: Make sure you have called validateProgram(...) with proper params')
    console.log('[v0] Or manually fill in form and run: validateProgram(window.__wallet, formData, blockHeight, balance, fee)')
  }
}