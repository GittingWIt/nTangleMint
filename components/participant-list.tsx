import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import type { Program } from "@/lib/storage-service-compat"

interface ParticipantListProps {
  program: Program
}

export function ParticipantList({ program }: ParticipantListProps) {
  const participants = program.participants || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No participants have joined this program yet</div>
        ) : (
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div key={index} className="p-2 border rounded-md">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono">{participant}</code>
                  <Badge variant="outline">User</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}