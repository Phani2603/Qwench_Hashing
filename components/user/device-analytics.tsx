"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone } from "lucide-react"
import { Loader2 } from "lucide-react"

interface DeviceData {
  android: number
  ios: number
  desktop: number
  androidPercentage: number
  iosPercentage: number
  desktopPercentage: number
  total: number
}

interface DeviceAnalyticsProps {
  token?: string | null
  userQRCodes?: any[]
}

// A simple device breakdown visualization
const DeviceBreakdownChart = ({ deviceData }: { deviceData: DeviceData }) => {
  const total = deviceData.total || 0
  
  // Return if no data
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[120px]">
        <p className="text-muted-foreground">No scan data available</p>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center h-[120px] relative">
      {/* Simple visual representation of device breakdown */}
      <div className="w-[120px] h-[120px] rounded-full overflow-hidden flex">
        {deviceData.androidPercentage > 0 && (
          <div 
            className="bg-green-500 h-full" 
            style={{ width: `${deviceData.androidPercentage}%` }}
            title={`Android: ${deviceData.androidPercentage}%`}
          />
        )}
        {deviceData.iosPercentage > 0 && (
          <div 
            className="bg-blue-500 h-full" 
            style={{ width: `${deviceData.iosPercentage}%` }}
            title={`iOS: ${deviceData.iosPercentage}%`}
          />
        )}
        {deviceData.desktopPercentage > 0 && (
          <div 
            className="bg-purple-500 h-full" 
            style={{ width: `${deviceData.desktopPercentage}%` }}
            title={`Desktop: ${deviceData.desktopPercentage}%`}
          />
        )}
      </div>
    </div>
  )
}

const DeviceAnalytics: React.FC<DeviceAnalyticsProps> = ({ token, userQRCodes = [] }) => {
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceData>({
    android: 0,
    ios: 0,
    desktop: 0,
    androidPercentage: 0,
    iosPercentage: 0,
    desktopPercentage: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  
  useEffect(() => {
    const fetchDeviceAnalytics = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/analytics/devices`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.deviceAnalytics) {
            setDeviceAnalytics(data.deviceAnalytics)
          } else {
            console.error("Invalid device analytics data format")
            setError("Failed to load device analytics")
          }
        } else {
          console.error("Failed to fetch device analytics")
          setError("Failed to load device analytics")
        }
      } catch (err) {
        console.error("Error fetching device analytics:", err)
        setError("Error loading device analytics")
      } finally {
        setLoading(false)
      }
    }

    fetchDeviceAnalytics()
  }, [token, API_BASE_URL])
  return (
    <Card className="col-span-full md:col-span-3 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>Device Analytics</span>
        </CardTitle>
        <CardDescription>Breakdown of devices scanning your QR codes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading device analytics...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <DeviceBreakdownChart deviceData={deviceAnalytics} />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Android</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {deviceAnalytics.android || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {deviceAnalytics.androidPercentage || 0}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">iOS</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                  {deviceAnalytics.ios || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {deviceAnalytics.iosPercentage || 0}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Desktop</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">
                  {deviceAnalytics.desktop || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {deviceAnalytics.desktopPercentage || 0}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DeviceAnalytics
