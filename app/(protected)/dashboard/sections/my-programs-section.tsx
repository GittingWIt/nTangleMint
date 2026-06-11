'use client'

import { useState } from 'react'
import type { Program, ProgramType, ProgramStatus } from '@/lib/types'
import type { DraftProgram } from '@/hooks/use-draft-programs'
import { useDraftPrograms } from '@/hooks/use-draft-programs'
import { useToast } from '@/hooks/use-toast'
import { DraftProgramCard } from '@/components/programs/draft-program-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Loader2, Unlock, Trash2 } from 'lucide-react'
import { getPrivKeyWif, getStoredPassword, getStoredMnemonic } from '@/lib/services/wallet-service'
import { broadcastProgramCreation, deleteProgram } from '@/lib/services/program-service'

interface MyProgramsSectionProps {
  programs: Program[]
  blockHeight: number
  wallet: { publicAddress: string } | null
  isLoading?: boolean
  onProgramsUpdated?: () => void
}

export function MyProgramsSection({
  programs,
  blockHeight,
  wallet,
  isLoading = false,
  onProgramsUpdated
}: MyProgramsSectionProps) {
  const { getDraftsByCreator, deleteDraft } = useDraftPrograms()
  const { toast } = useToast()
  const [activatingProgramId, setActivatingProgramId] = useState<string | null>(null)
  const [activationError, setActivationError] = useState<string | null>(null)
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null)

  const activePrograms = programs.filter(p => p.status === 'active')
  
  // SECURITY FIX: Only show draft programs created by the current wallet
  const myDrafts = wallet ? getDraftsByCreator(wallet.publicAddress) : []
  
  // Debug: log drafts found
  if (typeof window !== 'undefined') {
    console.log('[v0] MyProgramsSection - wallet:', wallet?.publicAddress, 'myDrafts:', myDrafts.length, 'drafts:', myDrafts)
  }

  const handleActivateDraft = async (draft: DraftProgram) => {
    try {
      setActivatingProgramId(draft.draftId)
      setActivationError(null)

      if (!wallet) {
        setActivationError('Wallet not connected')
        toast({
          title: 'Error',
          description: 'Wallet not connected',
          variant: 'destructive'
        })
        return
      }

      // Get wallet credentials
      const mnemonic = getStoredMnemonic()
      const password = getStoredPassword()

      if (!mnemonic) {
        setActivationError('Wallet mnemonic not found. Please restore your wallet.')
        toast({
          title: 'Error',
          description: 'Wallet credentials not found',
          variant: 'destructive'
        })
        return
      }

      const privKeyWif = getPrivKeyWif(mnemonic, password)
      if (!privKeyWif) {
        setActivationError('Unable to derive private key from wallet')
        toast({
          title: 'Error',
          description: 'Unable to derive private key',
          variant: 'destructive'
        })
        return
      }

      const programToActivate: Program = {
        // OnChainProgram fields (required)
        id: draft.id,
        type: draft.type as ProgramType,
        name: draft.name,
        creatorAddress: draft.creatorAddress,
        txId: '',
        blockHeight: 0,
        timestamp: Date.now(),
        requiredPunches: draft.requiredPunches,
        expirationDays: draft.expirationDays || 365,
        reward: draft.reward,
        
        // Program-specific fields (required)
        // Status will be determined by application logic: program is "active" if expirationDays > 0
        status: 'active' as ProgramStatus,
        participantCount: 0,
        createdAt: new Date(draft.createdAt).toISOString(),
        updatedAt: new Date().toISOString(),
        description: draft.description,
        isPublic: false,
        participants: [],
        
        // Optional fields
        metadata: {
          programId: draft.id,
          programName: draft.name,
          creatorAddress: draft.creatorAddress,
          creatorName: draft.metadata?.creatorName,
          lastSeenOnChain: Date.now(),
          verifiedOnChain: false
        },
        data: {
          satoshisPerPunch: (draft as any).satoshisPerPunch || draft.data?.satoshisPerPunch,
          termsConditions: (draft as any).termsConditions || draft.data?.termsConditions,
          registrationFee: (draft as any).registrationFee || draft.data?.registrationFee,
        }
      }

      const result = await broadcastProgramCreation(programToActivate, privKeyWif, wallet.publicAddress)

      if (result.success) {
        console.log('[v0] Program activated successfully:', draft.draftId)
        
        // Delete draft from localStorage only after successful broadcast
        await deleteDraft(draft.draftId)

        toast({
          title: 'Success',
          description: `Program "${draft.name}" has been activated and broadcast to the blockchain!`
        })

        // Refresh programs if callback provided
        if (onProgramsUpdated) {
          onProgramsUpdated()
        }
      } else {
        setActivationError(result.error || 'Failed to activate program')
        toast({
          title: 'Error',
          description: result.error || 'Failed to activate program',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('[v0] Error activating draft:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      setActivationError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      })
    } finally {
      setActivatingProgramId(null)
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraft(draftId)
      toast({
        title: 'Success',
        description: 'Draft program deleted'
      })
    } catch (error) {
      console.error('[v0] Error deleting draft:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete draft',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteActiveProgram = async (programId: string) => {
    try {
      setDeletingProgramId(programId)

      if (!wallet) {
        toast({
          title: 'Error',
          description: 'Wallet not connected',
          variant: 'destructive'
        })
        return
      }

      // Find the program to get its creator address
      const program = activePrograms.find(p => p.id === programId)
      if (!program) {
        toast({
          title: 'Error',
          description: 'Program not found',
          variant: 'destructive'
        })
        return
      }

      // CRITICAL: Verify authorization - only the creator can delete
      if (program.creatorAddress !== wallet.publicAddress) {
        toast({
          title: 'Unauthorized',
          description: 'Only the program creator can delete this program',
          variant: 'destructive'
        })
        setDeletingProgramId(null)
        return
      }

      // Get wallet credentials
      const mnemonic = getStoredMnemonic()
      const password = getStoredPassword()

      if (!mnemonic) {
        toast({
          title: 'Error',
          description: 'Wallet credentials not found',
          variant: 'destructive'
        })
        return
      }

      const privKeyWif = getPrivKeyWif(mnemonic, password)
      if (!privKeyWif) {
        toast({
          title: 'Error',
          description: 'Unable to derive private key',
          variant: 'destructive'
        })
        return
      }

      // Delete program from blockchain
      const result = await deleteProgram(programId, wallet.publicAddress, privKeyWif)

      if (result.success) {
        console.log('[v0] Program deleted successfully:', programId)
        toast({
          title: 'Success',
          description: 'Program has been deleted from the blockchain'
        })

        // Refresh programs
        if (onProgramsUpdated) {
          onProgramsUpdated()
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete program',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('[v0] Error deleting program:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete program',
        variant: 'destructive'
      })
    } finally {
      setDeletingProgramId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Programs</h2>
        <p className="text-sm text-muted-foreground">Programs you&apos;ve created</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : myDrafts.length === 0 && programs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold">No programs yet</h3>
            <p className="text-sm text-muted-foreground">Create your first loyalty program</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {activationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{activationError}</p>
            </div>
          )}

          {/* Draft Programs Section */}
          {myDrafts.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Draft Programs ({myDrafts.length})</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your unsaved programs. Click Activate to broadcast to the blockchain. Drafts expire after 24 hours.
                </p>
              </div>
              <div className="grid gap-4">
                {myDrafts.map((draft) => (
                  <DraftProgramCard
                    key={draft.draftId}
                    draft={draft}
                    isActivating={activatingProgramId === draft.draftId}
                    onActivate={handleActivateDraft}
                    onDelete={handleDeleteDraft}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Programs Section */}
          {activePrograms.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Active Programs ({activePrograms.length})</h3>
                <p className="text-sm text-muted-foreground mb-4">Programs currently broadcasting on the blockchain</p>
              </div>
              <div className="grid gap-4">
                {activePrograms.map((program) => (
                  <Card key={program.id} className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{program.name}</CardTitle>
                          <CardDescription className="text-xs">{program.id}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                            ✓ Active
                          </span>
                          <Button
                            onClick={() => handleDeleteActiveProgram(program.id)}
                            disabled={deletingProgramId === program.id}
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                          >
                            {deletingProgramId === program.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Satoshis/Punch:</span>
                          <span className="font-medium">{program.data?.satoshisPerPunch || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Required Punches:</span>
                          <span className="font-medium">{program.requiredPunches}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}