"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface QRCodeData {
  _id: string
  codeId: string
  websiteURL: string
  websiteTitle: string
  assignedTo: {
    name: string
    email: string
  }
  category: {
    name: string
    color: string
  }
  scanCount: number
}

export default function ScanPage() {
  const params = useParams()
  const codeId = params.codeId as string
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const verifyAndRedirect = async () => {
      if (!codeId) return

      try {
        const response = await fetch(`${API_BASE_URL}/qrcodes/verify/${codeId}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setQrData(data.qrCode)

          // Wait a moment to show the verification, then redirect
          setTimeout(() => {
            setRedirecting(true)
            window.location.href = `/scan/${codeId}`
          }, 2000)
        } else {
          setError("QR code not found or invalid")
        }
      } catch (err) {
        console.error("Error verifying QR code:", err)
        setError("Error verifying QR code")
      } finally {
        setLoading(false)
      }
    }

    verifyAndRedirect()
  }, [codeId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Verifying QR Code...</p>
            <p className="text-sm text-muted-foreground">Please wait while we process your scan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">QR Code Invalid</CardTitle>
            <CardDescription>The QR code you scanned is not valid or has been deactivated.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-4" />
            <p className="text-lg font-medium">Redirecting...</p>
            <p className="text-sm text-muted-foreground">Taking you to {qrData?.websiteTitle}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-600">QR Code Verified</CardTitle>
          <CardDescription>Your scan has been successfully verified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrData && (
            <>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">{qrData.websiteTitle}</h3>
                <Badge variant="outline" style={{ borderColor: qrData.category.color, color: qrData.category.color }}>
                  {qrData.category.name}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">{qrData.assignedTo.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total scans:</span>
                  <span className="font-medium">{qrData.scanCount + 1}</span>
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full" onClick={() => window.open(qrData.websiteURL, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit {qrData.websiteTitle}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You will be automatically redirected in a moment...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
