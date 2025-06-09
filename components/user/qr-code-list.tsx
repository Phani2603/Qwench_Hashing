"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QrCode, Loader2, Eye, ExternalLink, Activity } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface UserQRCode {
  _id: string
  codeId: string
  imageURL: string
  websiteURL: string
  websiteTitle: string
  category: {
    _id: string
    name: string
    color: string
  }
  scanCount: number
  lastScanned?: string
  createdAt: string
}

export default function QRCodeList() {
  const { user, token } = useAuth()
  const [qrCodes, setQrCodes] = useState<UserQRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [currentQR, setCurrentQR] = useState<UserQRCode | null>(null)

  useEffect(() => {
    if (user?._id && token) {
      fetchQRCodes()
    }
  }, [user, token])

  const fetchQRCodes = async () => {
    if (!user?._id || !token) return

    try {
      const response = await fetch(`${API_BASE_URL}/qrcodes/user/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodes(data.qrCodes || [])
      } else {
        console.error("Failed to fetch QR codes")
      }
    } catch (err) {
      console.error("Error fetching QR codes:", err)
    } finally {
      setLoading(false)
    }
  }

  const viewQRCode = (qrCode: UserQRCode) => {
    setCurrentQR(qrCode)
    setShowQRDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTotalScans = () => {
    return qrCodes.reduce((total, qr) => total + qr.scanCount, 0)
  }

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading QR codes...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>My QR Codes ({qrCodes.length})</span>
          </CardTitle>
          <CardDescription>QR codes generated for your websites with scan analytics</CardDescription>
        </CardHeader>
        <CardContent>
          {qrCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No QR codes generated yet</p>
              <p className="text-sm">
                Add your website URLs and ask an administrator to generate QR codes for your business
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total QR Codes</p>
                      <p className="text-2xl font-bold">{qrCodes.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                      <p className="text-2xl font-bold">{getTotalScans()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Websites</p>
                      <p className="text-2xl font-bold">{new Set(qrCodes.map((qr) => qr.websiteURL)).size}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code List */}
              <div className="space-y-4">
                {qrCodes.map((qrCode) => (
                  <div key={qrCode._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: qrCode.category.color }} />
                          <div>
                            <h3 className="font-medium">{qrCode.websiteTitle}</h3>
                            <p className="text-sm text-muted-foreground">Category: {qrCode.category.name}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Website URL</p>
                            <a
                              href={qrCode.websiteURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center space-x-1"
                            >
                              <span>{qrCode.websiteURL}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">QR Code ID</p>
                            <p className="text-sm font-mono">{qrCode.codeId.substring(0, 8)}...</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">Total Scans</p>
                            <p className="text-lg font-bold text-green-600">{qrCode.scanCount}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Created</p>
                            <p>{formatDate(qrCode.createdAt)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Last Scanned</p>
                            <p>{qrCode.lastScanned ? formatDateTime(qrCode.lastScanned) : "Never"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => viewQRCode(qrCode)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View QR
                        </Button>
                        <Badge
                          variant="outline"
                          style={{ borderColor: qrCode.category.color, color: qrCode.category.color }}
                        >
                          {qrCode.category.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* QR Code View Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Details</DialogTitle>
            <DialogDescription>QR Code for {currentQR?.websiteTitle}</DialogDescription>
          </DialogHeader>
          {currentQR && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={`${API_BASE_URL}${currentQR.imageURL}`}
                  alt="QR Code"
                  className="w-64 h-64"
                  onError={(e) => {
                    console.error("Failed to load QR code image:", currentQR.imageURL)
                    e.currentTarget.src = "/placeholder.svg?height=256&width=256"
                  }}
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-medium">{currentQR.websiteTitle}</h3>
                <p className="text-sm text-muted-foreground">Redirects to: {currentQR.websiteURL}</p>
                <Badge
                  variant="outline"
                  style={{ borderColor: currentQR.category.color, color: currentQR.category.color }}
                >
                  {currentQR.category.name}
                </Badge>
                <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                  <div>
                    <p className="font-medium">Total Scans</p>
                    <p className="text-lg font-bold text-green-600">{currentQR.scanCount}</p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{formatDate(currentQR.createdAt)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Code ID: {currentQR.codeId}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowQRDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
