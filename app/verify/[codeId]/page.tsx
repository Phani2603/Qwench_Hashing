"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface QRCodeVerification {
  valid: boolean
  qrCode?: {
    codeId: string
    assignedTo: {
      name: string
      email: string
    }
    category: {
      name: string
      color: string
    }
    createdAt: string
  }
}

export default function VerifyQRCode() {
  const { codeId } = useParams()
  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState<QRCodeVerification | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const verifyQRCode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/qrcodes/verify/${codeId}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setVerification({
            valid: true,
            qrCode: data.qrCode,
          })
        } else {
          setVerification({
            valid: false,
          })
          setError(data.message || "QR code is invalid or not found")
        }
      } catch (err) {
        console.error("Error verifying QR code:", err)
        setError("Failed to verify QR code")
        setVerification({
          valid: false,
        })
      } finally {
        setLoading(false)
      }
    }

    if (codeId) {
      verifyQRCode()
    }
  }, [codeId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">QR Code Verification</CardTitle>
          <CardDescription>Verifying QR code: {codeId}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-lg font-medium">Verifying QR code...</p>
            </div>
          ) : verification?.valid ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 dark:text-green-400" />
                <p className="text-xl font-medium text-green-600 dark:text-green-400">QR Code Valid</p>
              </div>

              <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-sm font-medium">Code ID:</p>
                  <p className="text-sm font-mono">{verification.qrCode?.codeId}</p>

                  <p className="text-sm font-medium">Assigned To:</p>
                  <p className="text-sm">{verification.qrCode?.assignedTo.name}</p>

                  <p className="text-sm font-medium">Email:</p>
                  <p className="text-sm">{verification.qrCode?.assignedTo.email}</p>

                  <p className="text-sm font-medium">Category:</p>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: verification.qrCode?.category.color }}
                    />
                    <span className="text-sm">{verification.qrCode?.category.name}</span>
                  </div>

                  <p className="text-sm font-medium">Created At:</p>
                  <p className="text-sm">
                    {verification.qrCode?.createdAt ? formatDate(verification.qrCode.createdAt) : "N/A"}
                  </p>
                </div>
              </div>

              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/50">
                <AlertDescription className="text-green-700 dark:text-green-400">
                  This QR code has been successfully verified and is valid.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <XCircle className="h-16 w-16 text-destructive" />
                <p className="text-xl font-medium text-destructive">Invalid QR Code</p>
              </div>

              <Alert variant="destructive">
                <AlertDescription>{error || "This QR code is invalid or has been revoked."}</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
