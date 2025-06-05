"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, BarChart3, TrendingUp, Users, Globe } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface QRCodeScan {
  _id: string
  qrCodeId: string
  assignedTo: string
  category: string
  categoryColor: string
  websiteTitle: string
  websiteURL: string
  totalScans: number
  lastScanned: string
}

interface CategoryScan {
  _id: string
  name: string
  color: string
  totalScans: number
}

interface DailyScan {
  _id: {
    year: number
    month: number
    day: number
  }
  count: number
}

interface DeviceAnalytic {
  _id: string
  count: number
}

interface Analytics {
  period: string
  qrCodeScans: QRCodeScan[]
  categoryScans: CategoryScan[]
  dailyScans: DailyScan[]
  deviceAnalytics: DeviceAnalytic[]
  totalScans: number
}

export default function QRAnalytics() {
  const { token } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("7d")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/qrcodes/analytics?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        console.error("Failed to fetch analytics")
      }
    } catch (err) {
      console.error("Error fetching analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateObj: { year: number; month: number; day: number }) => {
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day).toLocaleDateString()
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "24h":
        return "Last 24 Hours"
      case "7d":
        return "Last 7 Days"
      case "30d":
        return "Last 30 Days"
      default:
        return "Last 7 Days"
    }
  }

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading analytics...</span>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="bg-card">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>QR Code Analytics</span>
            </CardTitle>
            <CardDescription>Comprehensive scan analytics and insights</CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                  <p className="text-2xl font-bold">{analytics.totalScans}</p>
                  <p className="text-xs text-muted-foreground">{getPeriodLabel(period)}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active QR Codes</p>
                  <p className="text-2xl font-bold">{analytics.qrCodeScans.length}</p>
                  <p className="text-xs text-muted-foreground">With scans</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{analytics.categoryScans.length}</p>
                  <p className="text-xs text-muted-foreground">Active categories</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Daily Scans</p>
                  <p className="text-2xl font-bold">
                    {analytics.dailyScans.length > 0
                      ? Math.round(analytics.totalScans / analytics.dailyScans.length)
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Per day</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing QR Codes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing QR Codes</CardTitle>
                <CardDescription>Most scanned QR codes in {getPeriodLabel(period).toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.qrCodeScans.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No scan data available</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.qrCodeScans.slice(0, 5).map((qr, index) => (
                      <div key={qr._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: qr.categoryColor }} />
                          <div>
                            <p className="font-medium text-sm">{qr.websiteTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {qr.assignedTo} • {qr.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{qr.totalScans}</p>
                          <p className="text-xs text-muted-foreground">scans</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Performance</CardTitle>
                <CardDescription>Scans by category in {getPeriodLabel(period).toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.categoryScans.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No category data available</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.categoryScans.map((category) => (
                      <div key={category._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-blue-600">{category.totalScans}</span>
                          <Badge variant="outline" style={{ borderColor: category.color, color: category.color }}>
                            {Math.round((category.totalScans / analytics.totalScans) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Scan Trend */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Daily Scan Trend</CardTitle>
              <CardDescription>Scan activity over {getPeriodLabel(period).toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.dailyScans.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No daily scan data available</p>
              ) : (
                <div className="space-y-2">
                  {analytics.dailyScans.map((day) => (
                    <div
                      key={`${day._id.year}-${day._id.month}-${day._id.day}`}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                    >
                      <span className="text-sm font-medium">{formatDate(day._id)}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.min((day.count / Math.max(...analytics.dailyScans.map((d) => d.count))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8 text-right">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Analytics */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Device Analytics</CardTitle>
              <CardDescription>Scan distribution by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.deviceAnalytics.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No device data available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analytics.deviceAnalytics.map((device) => (
                    <div key={device._id} className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-primary">{device.count}</p>
                      <p className="text-sm font-medium capitalize">{device._id || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((device.count / analytics.totalScans) * 100)}% of total
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-center">
            <Button onClick={fetchAnalytics} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
