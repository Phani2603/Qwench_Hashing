"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Loader2, AlertCircle } from "lucide-react"

interface ScanActivityData {
  date: string
  scans: number
}

interface ScanActivityAnalyticsProps {
  token?: string | null
}

// Helper function to format dates for display
const formatDateForDisplay = (dateString: string, timeframe: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString // Return original if invalid
    
    switch (timeframe) {
      case 'daily':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'weekly':
        return `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  } catch (error) {
    console.error('Date formatting error:', error)
    return dateString
  }
}

// Enhanced activity chart component
const ScanActivityChart = ({ scanData = [], timeframe = "daily" }: { 
  scanData: ScanActivityData[] 
  timeframe: string 
}) => {
  console.log("📊 Chart received data:", scanData) // Debug log
  
  if (!scanData || scanData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px] bg-muted/20 rounded-lg">
        <Activity className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground font-medium">No scan activity data available</p>
        <p className="text-xs text-muted-foreground mt-1">
          QR codes need to be scanned to show activity trends
        </p>
      </div>
    )
  }

  const maxValue = Math.max(...scanData.map(item => item.scans), 1)
  const totalScans = scanData.reduce((sum, item) => sum + item.scans, 0)
  
  return (
    <div className="w-full">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{totalScans}</div>
          <div className="text-xs text-muted-foreground">Total Scans</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{scanData.length}</div>
          <div className="text-xs text-muted-foreground">Active Days</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{maxValue}</div>
          <div className="text-xs text-muted-foreground">Peak Activity</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] mt-4">
        <div className="flex items-end justify-center h-[160px] space-x-1 px-2">
          {scanData.map((item, index) => {
            const height = (item.scans / maxValue) * 140 // Max height 140px
            const formattedDate = formatDateForDisplay(item.date, timeframe)
            
            return (
              <div key={index} className="flex flex-col items-center group flex-1 max-w-[50px]">
                <div 
                  className="bg-primary/70 hover:bg-primary rounded-t-sm transition-all duration-200 w-full group-hover:scale-105"
                  style={{ 
                    height: `${Math.max(height, 3)}px`,
                    minHeight: '3px'
                  }}
                  title={`${formattedDate}: ${item.scans} scans`}
                />
                <span 
                  className="text-[9px] text-muted-foreground mt-1 rotate-45 origin-left truncate w-[40px]"
                  title={formattedDate}
                >
                  {formattedDate}
                </span>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-3 pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {timeframe === 'daily' ? 'Daily Activity (Last 14 Days)' : 
             timeframe === 'weekly' ? 'Weekly Activity (Last 4 Weeks)' : 
             'Monthly Activity (Last 6 Months)'}
          </span>
        </div>
      </div>
    </div>
  )
}

const ScanActivityAnalytics: React.FC<ScanActivityAnalyticsProps> = ({ token }) => {
  const [timeframe, setTimeframe] = useState("daily")
  const [scanActivityData, setScanActivityData] = useState<ScanActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  
  useEffect(() => {
    const fetchScanActivity = async () => {
      console.log("🔄 Fetching scan activity...") // Debug log
      console.log("🔧 Token present:", !!token) // Debug log
      console.log("🌐 API URL:", API_BASE_URL) // Debug log
      console.log("📅 Timeframe:", timeframe) // Debug log
      
      setLoading(true)
      setError(null)
      setDebugInfo(null)
      
      if (!token) {
        console.log("❌ No token provided")
        setError("Authentication required")
        setLoading(false)
        return
      }

      try {
        const url = `${API_BASE_URL}/analytics/activity?timeframe=${timeframe}`
        console.log("📡 Fetching from:", url) // Debug log
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log("📨 Response status:", response.status) // Debug log
        console.log("📨 Response headers:", Object.fromEntries(response.headers.entries())) // Debug log

        if (response.ok) {
          const data = await response.json()
          console.log("📦 Response data:", data) // Debug log
          
          setDebugInfo({
            status: response.status,
            dataKeys: Object.keys(data),
            hasActivityData: !!data.activityData,
            activityDataLength: data.activityData?.length || 0
          })
          
          if (data.success && Array.isArray(data.activityData)) {
            // Ensure data is properly formatted
            const formattedData = data.activityData.map((item: any) => ({
              date: item.date || item._id || 'Unknown',
              scans: parseInt(item.scans) || parseInt(item.count) || 0
            }))
            
            console.log("✅ Formatted data:", formattedData) // Debug log
            setScanActivityData(formattedData)
            
            if (formattedData.length === 0) {
              setError("No scan activity found for the selected timeframe")
            }
          } else {
            console.error("❌ Invalid response format:", data)
            setError("Received invalid data format from server")
          }
        } else {
          const errorText = await response.text()
          console.error("❌ API Error:", response.status, errorText) // Debug log
          setError(`Failed to load data (${response.status})`)
        }
      } catch (err) {
        console.error("❌ Network error:", err) // Debug log
        setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)      } finally {
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
          <CardDescription>
            Track QR code usage trends over time
            {debugInfo && (
              <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                Debug: {debugInfo.activityDataLength} data points
              </span>
            )}
          </CardDescription>
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
            <Loader2 className="h-8 w-8 animate-spin mr-3 text-primary" />
            <span className="text-muted-foreground">Loading scan activity...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 h-[250px]">
            <AlertCircle className="h-12 w-12 text-destructive/50 mb-2" />
            <p className="text-destructive font-medium text-center">{error}</p>
            {debugInfo && (
              <details className="mt-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer">Debug Info</summary>
                <pre className="mt-1 bg-muted p-2 rounded text-[10px]">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 text-xs text-muted-foreground hover:text-primary underline"
            >
              Try refreshing the page
            </button>
          </div>
        ) : (
          <ScanActivityChart scanData={scanActivityData} timeframe={timeframe} />
        )}
      </CardContent>
    </Card>
  )
}

export default ScanActivityAnalytics
