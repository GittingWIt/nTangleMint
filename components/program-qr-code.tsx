"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { Program } from "@/lib/storage-service-compat"

interface ProgramQrCodeProps {
  program: Program
}

export function ProgramQrCode({ program }: ProgramQrCodeProps) {
  // In a real implementation, we would generate a QR code here
  // For now, we'll just display a placeholder

  const handleDownload = () => {
    alert("QR code download functionality would be implemented here")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="w-64 h-64 bg-muted flex items-center justify-center mb-4 border">
          <p className="text-muted-foreground text-center">
            QR Code for program:
            <br />
            {program.name}
            <br />
            ID: {program.id}
          </p>
        </div>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  )
}