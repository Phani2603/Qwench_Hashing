"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, ExternalLink, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface QRCodeData {
  codeId: string
  assignedTo: {
    name: string
    email: string
  }
  category: {
    name: string
    color: string
  }
  websiteURL: string
  websiteTitle: string
  scanCount: number
  createdAt: string
}

interface VerificationResponse {
  success: boolean
  valid: boolean
  qrCode?: QRCodeData
  message?: string
}

export default function VerifyQRCode() {
  const { codeId } = useParams()
  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState<VerificationResponse | null>(null)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(3)
  const [redirecting, setRedirecting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanLogged, setScanLogged] = useState(false)

  useEffect(() => {
    const verifyQRCode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/qrcodes/verify/${codeId}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setVerification(data)
          // Log the scan after successful verification
          logScan()
        } else {
          setVerification(data)
          setError(data.message || "QR code is invalid or not found")
        }
      } catch (err) {
        console.error("Error verifying QR code:", err)
        setError("Failed to verify QR code")
        setVerification({
          success: false,
          valid: false,
        })
      } finally {
        setLoading(false)
      }
    }

    const logScan = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/qrcodes/verify/${codeId}/scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          setScanLogged(true)
          console.log('Scan logged successfully')
        }
      } catch (err) {
        console.error('Error logging scan:', err)
        // Don't fail the whole process if scan logging fails
      }
    }

    if (codeId) {
      verifyQRCode()
    }
  }, [codeId])

  // Countdown and redirect logic
  useEffect(() => {
    if (verification?.valid && verification.qrCode?.websiteURL) {
      let timer: NodeJS.Timeout | null = null
      let progressTimer: NodeJS.Timeout | null = null

      // Main countdown timer
      timer = setInterval(() => {
        setCountdown((prev) => {
          console.log('Countdown:', prev) // Debug log
          if (prev <= 1) {
            console.log('Redirecting to:', verification.qrCode!.websiteURL) // Debug log
            setRedirecting(true)
            
            // Clear timers before redirect
            if (timer) clearInterval(timer)
            if (progressTimer) clearInterval(progressTimer)
            
            // Redirect after a small delay to ensure state updates
            setTimeout(() => {
              window.location.href = verification.qrCode!.websiteURL
            }, 100)
            
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Progress bar animation (updates every 100ms for smooth animation)
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / 30) // 3 seconds = 30 intervals of 100ms
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 100)

      return () => {
        if (timer) clearInterval(timer)
        if (progressTimer) clearInterval(progressTimer)
      }
    }
  }, [verification])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }
  
  const redirectNow = () => {
    if (verification?.qrCode?.websiteURL) {
      console.log('Manual redirect to:', verification.qrCode.websiteURL) // Debug log
      setRedirecting(true)
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        window.location.href = verification.qrCode!.websiteURL
      }, 100)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            QR Code Verification
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Processing code: <span className="font-mono font-medium">{codeId}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Verifying QR code...</p>
              <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
              </div>
            </div>
          ) : verification?.valid ? (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="relative">
                  <CheckCircle2 className="h-20 w-20 text-green-500 dark:text-green-400" />
                  <div className="absolute -inset-2 bg-green-100 dark:bg-green-900/30 rounded-full -z-10"></div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    Verification Successful!
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {verification.qrCode?.websiteTitle || "Redirecting to website"}
                  </p>
                </div>
              </div>

              {/* QR Code Details */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Code ID:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100 break-all">
                    {verification.qrCode?.codeId}
                  </span>

                  <span className="font-medium text-gray-600 dark:text-gray-400">Assigned To:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {verification.qrCode?.assignedTo.name}
                  </span>

                  <span className="font-medium text-gray-600 dark:text-gray-400">Category:</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: verification.qrCode?.category.color }}
                    />
                    <span className="text-gray-900 dark:text-gray-100">
                      {verification.qrCode?.category.name}
                    </span>
                  </div>

                  <span className="font-medium text-gray-600 dark:text-gray-400">Website:</span>
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 truncate">
                      {verification.qrCode?.websiteURL}
                    </span>
                  </div>

                  <span className="font-medium text-gray-600 dark:text-gray-400">Total Scans:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {verification.qrCode?.scanCount}
                  </span>
                </div>
              </div>

              {/* Countdown and Redirect */}
              {verification.qrCode?.websiteURL && !redirecting ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-center">
                      <Button
                        onClick={redirectNow}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Go Now</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : verification.qrCode?.websiteURL && redirecting ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-blue-600 dark:text-blue-400 font-medium">Redirecting...</p>
                </div>
              ) : (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/50">
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    This QR code has been successfully verified and is valid.
                  </AlertDescription>
                </Alert>
              )}

              {/* Footer Info */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                {scanLogged ? "Scan logged" : "Verification"} • Created {verification.qrCode?.createdAt ? formatDate(verification.qrCode.createdAt) : "N/A"}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Header */}
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="relative">
                  <XCircle className="h-20 w-20 text-red-500 dark:text-red-400" />
                  <div className="absolute -inset-2 bg-red-100 dark:bg-red-900/30 rounded-full -z-10"></div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                    Invalid QR Code
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    This code cannot be processed
                  </p>
                </div>
              </div>

              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 dark:text-red-400">
                  {error || "This QR code is invalid, expired, or has been deactivated."}
                </AlertDescription>
              </Alert>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                If you believe this is an error, please contact support
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
