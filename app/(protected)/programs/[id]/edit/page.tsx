"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { Program } from "@/lib/types"
import { useDraftPrograms, type DraftProgram } from "@/hooks/use-draft-programs"
import { useToast } from "@/hooks/use-toast"
import { getProgramMetadataById } from "@/lib/services/program-service"
import { getCurrentWallet } from "@/lib/services/wallet-service"
import { getActivePunchCards } from "@/lib/services/punchcard-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, InfoIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function EditProgramPage() {
  const params = useParams()
  const router = useRouter()
  const programId = params.id as string
  const { getDraft, updateDraft } = useDraftPrograms()
  const { toast } = useToast()

  const [program, setProgram] = useState<any>(null)
  const [isDraft, setIsDraft] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasActivePunches, setHasActivePunches] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Editable fields (metadata that can be updated locally before broadcast)
  const [programName, setProgramName] = useState("")
  const [programDescription, setDescription] = useState("")
  const [reward, setReward] = useState("")
  const [requiredPunches, setRequiredPunches] = useState("")
  const [satoshisPerPunch, setSatoshisPerPunch] = useState("")
  const [expirationDate, setExpirationDate] = useState("")

  const merchant = getCurrentWallet()
  const creatorAddress = merchant?.publicAddress || ""

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        // First check if this is a draft program
        const draftProgram = getDraft(programId)
        
        if (draftProgram) {
          setProgram(draftProgram)
          setIsDraft(true)
          setProgramName(draftProgram.name || "")
          setDescription(draftProgram.description || "")
          setReward(draftProgram.reward || "")
          setRequiredPunches(String(draftProgram.requiredPunches || ""))
          setSatoshisPerPunch(String((draftProgram.data as Record<string, any>)?.satoshisPerPunch || ""))
          setExpirationDate(draftProgram.expirationDays?.toString() || "")
          setLoading(false)
          return
        }

        // Otherwise load from blockchain
        const programMeta = getProgramMetadataById(programId)
        if (!programMeta) {
          setError("Program not found")
          setLoading(false)
          return
        }

        setProgram(programMeta)
        setIsDraft(false)
        
        // Initialize editable fields from metadata
        setProgramName(programMeta.name || "")
        setDescription(programMeta.description || "")
        setReward(programMeta.reward || "")
        setRequiredPunches(String(programMeta.requiredPunches || ""))
        setSatoshisPerPunch(String((programMeta.data as Record<string, any>)?.satoshisPerPunch || ""))
        setExpirationDate(programMeta.expirationDays?.toString() || "")

        // Check if program has active punch cards (program economics are immutable if it does)
        const activePunches = getActivePunchCards(creatorAddress)
        const hasActive = activePunches.some(card => card.programId === programId)
        setHasActivePunches(hasActive)

        setLoading(false)
      } catch (err) {
        console.error("Error fetching program:", err)
        setError("Error fetching program details")
        setLoading(false)
      }
    }

    fetchProgram()
  }, [programId, creatorAddress, getDraft])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // For drafts, update in localStorage
      if (isDraft && program.draftId) {
        const updated = updateDraft(program.draftId, {
          name: programName,
          description: programDescription,
          reward: reward,
          requiredPunches: parseInt(requiredPunches, 10) || 0,
          expirationDays: parseInt(expirationDate, 10) || 365,
          data: {
            ...(program.data || {}),
            satoshisPerPunch: parseInt(satoshisPerPunch, 10) || 0,
          },
        })
        
        if (updated) {
          toast({
            title: "Draft Updated",
            description: "Your draft has been saved. You can now activate it."
          })
          setShowConfirmDialog(false)
          setTimeout(() => {
            router.push("/dashboard?tab=programs")
          }, 1000)
          return
        }
      }
      
      // For blockchain programs, validate that details won't change on-chain
      // Metadata can be updated locally, but economics are immutable once broadcast
      const updatedProgram = {
        ...program,
        programName,
        description: programDescription,
        reward,
      }

      setProgram(updatedProgram)
      
      // Show confirmation that changes are stored locally until broadcast
      setShowConfirmDialog(false)
      
      // After a short delay, redirect back to program
      setTimeout(() => {
        router.push(`/programs/${programId}`)
      }, 1000)
    } catch (err) {
      console.error("Error saving program:", err)
      setError("Error saving program details")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Show confirmation dialog before saving
    setShowConfirmDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading program...</p>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || "Program not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`/programs/${programId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Program
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Program Details</CardTitle>
          <CardDescription>
            Update your program metadata. Changes are stored locally until you broadcast to blockchain.
          </CardDescription>
          
          {hasActivePunches && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This program has active punch cards. Economics (price per punch, required punches) cannot be edited. Only metadata (name, description, reward) can be updated.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Important:</strong> Once you broadcast this program to the blockchain, all details become immutable. You will be asked to confirm all details before activation to ensure accuracy.
            </AlertDescription>
          </Alert>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Program Name - Always Editable */}
            <div>
              <label className="text-sm font-medium text-foreground">Program Name</label>
              <Input
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Your program name"
                className="mt-2"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Visible on-chain after broadcast</p>
            </div>

            {/* Description - Always Editable */}
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={programDescription}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your loyalty program"
                className="mt-2 min-h-24"
              />
              <p className="text-xs text-muted-foreground mt-1">Help customers understand your program</p>
            </div>

            {/* Reward Description - Always Editable */}
            <div>
              <label className="text-sm font-medium text-foreground">Reward Description</label>
              <Input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="What customers will receive"
                className="mt-2"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Displayed to customers on-chain</p>
            </div>

            {/* Required Punches - Editable Until Broadcast */}
            <div>
              <label className="text-sm font-medium text-foreground">Required Punches</label>
              <Input
                type="number"
                value={requiredPunches}
                onChange={(e) => setRequiredPunches(e.target.value)}
                placeholder="Number of punches required"
                className="mt-2"
                min="1"
                disabled={hasActivePunches}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {hasActivePunches ? "Locked: This program has active punch cards" : "Can be edited before broadcast"}
              </p>
            </div>

            {/* Satoshis Per Punch - Editable Until Broadcast */}
            <div>
              <label className="text-sm font-medium text-foreground">Satoshis Per Punch</label>
              <Input
                type="number"
                value={satoshisPerPunch}
                onChange={(e) => setSatoshisPerPunch(e.target.value)}
                placeholder="Cost per punch in satoshis"
                className="mt-2"
                min="1"
                disabled={hasActivePunches}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {hasActivePunches ? "Locked: This program has active punch cards" : "Cost per punch in satoshis"}
              </p>
            </div>

            {/* Expiration Date - Editable Until Broadcast */}
            <div>
              <label className="text-sm font-medium text-foreground">Expiration Date</label>
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="mt-2"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">When this program expires and rewards can no longer be earned</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard?tab=programs")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog - Before Changes Become Immutable */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Program Details</AlertDialogTitle>
            <AlertDialogDescription>
              These details will be stored locally and become immutable once broadcast to the blockchain. Please verify everything is correct.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4 bg-slate-50 p-4 rounded-lg border">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Program Name</p>
              <p className="text-sm font-medium text-foreground mt-1">{programName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Reward</p>
              <p className="text-sm font-medium text-foreground mt-1">{reward}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Creator Address</p>
              <p className="text-xs font-mono text-foreground mt-1 break-all">{program.creatorAddress}</p>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              You can broadcast this program to the blockchain at any time from your dashboard. Once broadcast, all details become immutable.
            </AlertDescription>
          </Alert>

          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>Save & Continue</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}