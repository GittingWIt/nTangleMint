'use client'

import { useState } from 'react'
import type { DraftProgram } from '@/hooks/use-draft-programs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, Edit2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DraftProgramCardProps {
  draft: DraftProgram
  isActivating?: boolean
  onActivate: (draft: DraftProgram) => void | Promise<void>
  onDelete: (draftId: string) => void | Promise<void>
  isDeleting?: boolean
}

export function DraftProgramCard({
  draft,
  isActivating = false,
  onActivate,
  onDelete,
  isDeleting = false
}: DraftProgramCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting_, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await onDelete(draft.draftId)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('[v0] Error deleting draft:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const expiresAt = new Date(draft.expiresAt)
  const hoursLeft = Math.ceil((draft.expiresAt - Date.now()) / (1000 * 60 * 60))
  const programExpirationDate = draft.expirationDate ? new Date(draft.expirationDate) : null

  return (
    <>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="truncate">{draft.name}</CardTitle>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 whitespace-nowrap">
                  Draft
                </span>
              </div>
              <CardDescription className="text-xs truncate">{draft.id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Program Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Satoshis/Punch:</span>
                <span className="font-medium">{draft.satoshisPerPunch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required Punches:</span>
                <span className="font-medium">{draft.requiredPunches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiration:</span>
                <span className="font-medium">
                  {programExpirationDate ? programExpirationDate.toLocaleDateString() : draft.expirationDate || 'N/A'}
                </span>
              </div>
            </div>

            {/* Expiration Warning */}
            {hoursLeft < 12 && (
              <div className="p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800">
                ⚠️ This draft expires in {hoursLeft}h. Save or activate it now.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Link href={`/programs/${draft.draftId}/edit`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  disabled={isActivating || isDeleting_}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              </Link>

              <Button
                onClick={() => onActivate(draft)}
                disabled={isActivating || isDeleting_}
                size="sm"
                className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isActivating || isDeleting_}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Program?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the draft &quot;{draft.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting_}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting_}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting_ ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}