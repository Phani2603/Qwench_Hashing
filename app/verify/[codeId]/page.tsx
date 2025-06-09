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
  const [countdown, setCountdown] = useState(5)
  const [redirecting, setRedirecting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanLogged, setScanLogged] = useState(false)
  useEffect(() => {
    const verifyQRCode = async () => {
      try {
        console.log(`🔍 Starting verification for code: ${codeId}`);
        const response = await fetch(`${API_BASE_URL}/qrcodes/verify/${codeId}`)
        const data = await response.json()
        
        console.log('🔍 Verification response:', data);

        if (response.ok && data.valid) {
          console.log('✅ QR Code is valid:', data.qrCode);
          console.log('🌐 Website URL:', data.qrCode?.websiteURL);
          console.log('📄 Website Title:', data.qrCode?.websiteTitle);
          setVerification(data)
          // Log the scan after successful verification
          logScan()
        } else {
          console.log('❌ QR Code is invalid:', data);
          setVerification(data)
          setError(data.message || "QR code is invalid or not found")
        }
      } catch (err) {
        console.error("❌ Error verifying QR code:", err)
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
    console.log('🔄 Countdown effect triggered. Verification:', verification);
    console.log('🔄 Website URL available:', verification?.qrCode?.websiteURL);
    
    if (verification?.valid && verification.qrCode?.websiteURL) {
      console.log('🚀 Starting countdown for redirect to:', verification.qrCode.websiteURL);
      let timer: NodeJS.Timeout | null = null
      let progressTimer: NodeJS.Timeout | null = null

      // Main countdown timer
      timer = setInterval(() => {
        setCountdown((prev) => {
          console.log('⏰ Countdown:', prev); // Debug log
          if (prev <= 1) {
            console.log('🔗 Redirecting to:', verification.qrCode!.websiteURL); // Debug log
            setRedirecting(true)
            
            // Clear timers before redirect
            if (timer) clearInterval(timer)
            if (progressTimer) clearInterval(progressTimer)
            
            // Redirect after a small delay to ensure state updates
            setTimeout(() => {
              console.log('🌐 Executing redirect to:', verification.qrCode!.websiteURL);
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
          const newProgress = prev + (100 / 50) // 5 seconds = 50 intervals of 100ms
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 100)

      return () => {
        console.log('🧹 Cleaning up timers');
        if (timer) clearInterval(timer)
        if (progressTimer) clearInterval(progressTimer)
      }
    } else {
      console.log('⚠️ Countdown not started. Valid:', verification?.valid, 'URL:', verification?.qrCode?.websiteURL);
    }
  }, [verification])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }
    const redirectNow = () => {
    if (verification?.qrCode?.websiteURL) {
      console.log('👆 Manual redirect triggered to:', verification.qrCode.websiteURL); // Debug log
      setRedirecting(true)
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        console.log('🌐 Executing manual redirect to:', verification.qrCode!.websiteURL);
        window.location.href = verification.qrCode!.websiteURL
      }, 100)
    } else {
      console.error('❌ No website URL available for redirect');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_200px,#1e293b,transparent)] opacity-40"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
      
      <div className="relative flex min-h-screen items-center justify-center p-3 sm:p-6">
        <Card className="w-full max-w-[95%] sm:max-w-lg lg:max-w-xl bg-black/50 dark:bg-black/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50 mx-auto">
          <CardHeader className="text-center pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6 bg-gradient-to-br from-slate-900/20 to-black/20 rounded-t-lg">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M5 12H4m6 0H9m3 0h1m-4 0h1m0-3V9m0 0h1m-1 0H9m3 0h1m0 3h4" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
              QR Code Verification
            </CardTitle>
            <CardDescription className="text-gray-300 text-xs sm:text-sm px-2 sm:px-0">
              Processing code: <span className="font-mono font-semibold text-blue-400 break-all text-xs sm:text-sm">{codeId}</span>
            </CardDescription>
          </CardHeader>
        
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4 sm:space-y-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0">
                  <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500 animate-spin" />
                </div>
                <div className="absolute inset-3 sm:inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg sm:text-xl font-semibold text-gray-100">Verifying QR code...</p>
                <p className="text-sm text-gray-400 px-4 sm:px-0">Please wait while we process your request</p>
              </div>
              <div className="w-40 sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse rounded-full w-3/4"></div>
              </div>
            </div>
          ) : verification?.valid ? (
            <div className="space-y-6 sm:space-y-8">
              {/* Success Header */}
              <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur animate-pulse"></div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Verification Successful!
                  </p>
                  <p className="text-gray-300 text-base sm:text-lg px-4 sm:px-0">
                    {verification.qrCode?.websiteTitle || "Redirecting to website"}
                  </p>
                </div>
              </div>

              {/* QR Code Details */}
              <div className="bg-gradient-to-br from-slate-800/50 to-black/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-3 sm:mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  QR Code Details
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                      <span className="text-sm font-medium text-gray-400 min-w-[100px]">Code ID:</span>
                      <span className="font-mono text-sm bg-slate-800 px-3 py-1 rounded-lg text-gray-200 break-all">
                        {verification.qrCode?.codeId}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                      <span className="text-sm font-medium text-gray-400 min-w-[100px]">Assigned To:</span>
                      <span className="text-gray-200 font-medium">
                        {verification.qrCode?.assignedTo.name}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                      <span className="text-sm font-medium text-gray-400 min-w-[100px]">Category:</span>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-gray-600 shadow-sm"
                          style={{ backgroundColor: verification.qrCode?.category.color }}
                        />
                        <span className="text-gray-200 font-medium">
                          {verification.qrCode?.category.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                      <span className="text-sm font-medium text-gray-400 min-w-[100px]">Website:</span>
                      <div className="flex items-center space-x-2 bg-blue-900/30 px-3 py-2 rounded-lg">
                        <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-blue-400 text-sm break-all">
                          {verification.qrCode?.websiteURL}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                      <span className="text-sm font-medium text-gray-400 min-w-[100px]">Total Scans:</span>
                      <div className="flex items-center space-x-2">
                        <div className="bg-green-900/40 px-3 py-1 rounded-full">
                          <span className="text-green-400 font-bold text-lg">
                            {verification.qrCode?.scanCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Countdown and Redirect */}
              {verification.qrCode?.websiteURL && !redirecting ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-blue-800/30 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-900/50 rounded-full">
                        <Clock className="w-6 h-6 text-blue-400" />
                      </div>
                      <span className="text-blue-300 font-semibold text-lg">
                        Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <Progress 
                          value={progress} 
                          className="h-3 bg-slate-800" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          onClick={redirectNow}
                          className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                        >
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Go Now</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : verification.qrCode?.websiteURL && redirecting ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0">
                      <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-blue-400 font-semibold text-xl">Redirecting...</p>
                    <p className="text-gray-400 text-sm">Taking you to your destination</p>
                  </div>
                </div>
              ) : (              <Alert className="border-green-800/50 bg-green-900/30 rounded-xl backdrop-blur-sm">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <AlertDescription className="text-green-300 font-medium">
                  This QR code has been successfully verified and is valid.
                </AlertDescription>
              </Alert>
              )}

              {/* Footer Info */}
              <div className="text-center pt-4 border-t border-slate-700">
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{scanLogged ? "Scan logged" : "Verification"}</span>
                  <span>•</span>
                  <span>Created {verification.qrCode?.createdAt ? formatDate(verification.qrCode.createdAt) : "N/A"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Error Header */}
              <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/25">
                    <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full blur animate-pulse"></div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                    Invalid QR Code
                  </p>
                  <p className="text-gray-300 text-base sm:text-lg px-4 sm:px-0">
                    This code cannot be processed
                  </p>
                </div>
              </div>

              <Alert variant="destructive" className="border-red-800/50 bg-red-900/30 rounded-xl backdrop-blur-sm">
                <XCircle className="w-5 h-5" />
                <AlertDescription className="text-red-300 font-medium">
                  {error || "This QR code is invalid, expired, or has been deactivated."}
                </AlertDescription>
              </Alert>

              <div className="text-center pt-4 border-t border-slate-700">
                <p className="text-xs text-gray-400">
                  If you believe this is an error, please contact support
                </p>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
