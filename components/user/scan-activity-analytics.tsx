"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Loader2 } from "lucide-react"

interface ScanActivityData {
  date: string
  scans: number
}

interface ScanActivityAnalyticsProps {
  token?: string | null
}

// Simple activity chart component
const ScanActivityChart = ({ scanData = [], timeframe = "daily" }: { 
  scanData: ScanActivityData[] 
  timeframe: string 
}) => {
  if (!scanData || scanData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px]">
        <p className="text-muted-foreground">No scan activity data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...scanData.map(item => item.scans))
  
  return (
    <div className="w-full h-[250px] mt-4">
      <div className="flex items-end h-[200px] space-x-2 pl-10">
        {scanData.map((item, index) => {
          const height = maxValue > 0 ? (item.scans / maxValue) * 100 : 0
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-primary/80 hover:bg-primary rounded-t-md transition-all"
                style={{ height: `${height}%` }}
                title={`${item.date}: ${item.scans} scans`}
              />
              <span className="text-xs text-muted-foreground mt-2 truncate" style={{ maxWidth: '100%' }}>
                {item.date}
              </span>
            </div>
          )
        })}
      </div>
      <div className="text-center mt-4">
        <span className="text-xs text-muted-foreground">
          {timeframe === 'daily' ? 'Daily Scans' : timeframe === 'weekly' ? 'Weekly Scans' : 'Monthly Scans'}
        </span>
      </div>
    </div>
  )
}

const ScanActivityAnalytics: React.FC<ScanActivityAnalyticsProps> = ({ token }) => {
  const [timeframe, setTimeframe] = useState("daily")
  const [scanActivityData, setScanActivityData] = useState<ScanActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  
  useEffect(() => {
    const fetchScanActivity = async () => {
      setLoading(true)
      setError(null)
      
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/analytics/activity?timeframe=${timeframe}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.activityData) {
            setScanActivityData(data.activityData)
          } else {
            console.error("Invalid scan activity data format")
            setError("Failed to load scan activity data")
          }
        } else {
          console.error("Failed to fetch scan activity data")
          setError("Failed to load scan activity data")
        }
      } catch (err) {
        console.error("Error fetching scan activity:", err)
        setError("Error loading scan activity")
      } finally {
        setLoading(false)
      }
    }

    fetchScanActivity()
  }, [token, API_BASE_URL, timeframe])
  return (
    <Card className="col-span-full bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Scan Activity</span>
          </CardTitle>
          <CardDescription>Trends in QR code usage over time</CardDescription>
        </div>
        <Tabs defaultValue="daily" value={timeframe} onValueChange={setTimeframe} className="w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 h-[250px]">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading scan activity...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 h-[250px] text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <ScanActivityChart scanData={scanActivityData} timeframe={timeframe} />
        )}
      </CardContent>
    </Card>
  )
}

export default ScanActivityAnalytics
