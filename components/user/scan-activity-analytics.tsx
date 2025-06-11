"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Loader2, AlertCircle } from "lucide-react"

interface ScanActivityData {
  date: string
  scans: number
}

interface ScanActivityAnalyticsProps {
  token?: string | null
}

// GitHub-style heat map component with proper theme support
const ScanActivityHeatMap = ({ scanData = [], timeframe = "6months" }: { 
  scanData: ScanActivityData[] 
  timeframe: string 
}) => {
  console.log("📊 Heat map received data:", scanData) // Debug log
  
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

  // Generate date grid based on timeframe
  const generateDateGrid = () => {
    const today = new Date()
    const days = timeframe === '12months' ? 365 : 180 // 6 months default
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)
    
    const dateGrid = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= today) {
      dateGrid.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dateGrid
  }

  // Create scan data map for quick lookup
  const scanMap = new Map()
  scanData.forEach(item => {
    const dateKey = new Date(item.date).toDateString()
    scanMap.set(dateKey, item.scans)
  })

  const dateGrid = generateDateGrid()
  const maxScans = Math.max(...scanData.map(item => item.scans), 1)
  const totalScans = scanData.reduce((sum, item) => sum + item.scans, 0)

  // Get intensity level (0-4) based on scan count
  const getIntensity = (scans: number) => {
    if (scans === 0) return 0
    if (scans <= maxScans * 0.25) return 1
    if (scans <= maxScans * 0.5) return 2
    if (scans <= maxScans * 0.75) return 3
    return 4
  }

  // Get weeks for grid layout
  const getWeekRows = () => {
    const weeks = []
    let weekStart = new Date(dateGrid[0])
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start from Sunday
    
    while (weekStart <= dateGrid[dateGrid.length - 1] || weeks.length === 0) {
      const week = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        week.push(date)
      }
      weeks.push(week)
      weekStart.setDate(weekStart.getDate() + 7)
    }
    
    return weeks
  }

  const weeks = getWeekRows()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
          <div className="text-2xl font-bold text-primary">{maxScans}</div>
          <div className="text-xs text-muted-foreground">Peak Activity</div>
        </div>
      </div>

      {/* Heat Map */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex mb-2 ml-12 text-xs text-muted-foreground">
            {Array.from({ length: Math.ceil(weeks.length / 4.3) }, (_, i) => {
              const monthIndex = (new Date().getMonth() - Math.ceil(weeks.length / 4.3) + i + 12) % 12
              return (
                <div key={i} className="flex-1 text-center min-w-[60px]">
                  {months[monthIndex]}
                </div>
              )
            })}
          </div>
          
          {/* Heat map grid */}
          <div className="flex gap-1">
            {/* Weekday labels */}
            <div className="flex flex-col gap-1 mr-2">
              {weekdays.map((day, index) => (
                <div key={day} className="h-3 flex items-center">
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {index % 2 === 1 ? day.slice(0, 3) : ''}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Date grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((date, dayIndex) => {
                    const dateKey = date.toDateString()
                    const scans = scanMap.get(dateKey) || 0
                    const intensity = getIntensity(scans)
                    const isInRange = date >= dateGrid[0] && date <= dateGrid[dateGrid.length - 1]
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:ring-1 hover:ring-primary/50
                          ${!isInRange ? 'opacity-30' : ''}
                          ${intensity === 0 ? 'bg-muted border border-border' : ''}
                          ${intensity === 1 ? 'bg-primary/20' : ''}
                          ${intensity === 2 ? 'bg-primary/40' : ''}
                          ${intensity === 3 ? 'bg-primary/60' : ''}
                          ${intensity === 4 ? 'bg-primary/80' : ''}
                        `}
                        title={`${date.toLocaleDateString()}: ${scans} scans`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`
                    w-3 h-3 rounded-sm
                    ${level === 0 ? 'bg-muted border border-border' : ''}
                    ${level === 1 ? 'bg-primary/20' : ''}
                    ${level === 2 ? 'bg-primary/40' : ''}
                    ${level === 3 ? 'bg-primary/60' : ''}
                    ${level === 4 ? 'bg-primary/80' : ''}
                  `}
                />
              ))}
            </div>
            <span>More</span>
          </div>
          <div className="text-muted-foreground">
            {scanData.length > 0 && (
              <span>
                {timeframe === '12months' ? 'Last 12 months' : 'Last 6 months'} • {totalScans} total scans
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ScanActivityAnalytics: React.FC<ScanActivityAnalyticsProps> = ({ token }) => {
  const [timeframe, setTimeframe] = useState("6months")
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
        // Convert timeframe to backend format
        const backendTimeframe = timeframe === '6months' ? 'monthly' : 'monthly'
        const url = `${API_BASE_URL}/analytics/activity?timeframe=${backendTimeframe}`
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
            // Ensure data is properly formatted for heat map
            const formattedData = data.activityData.map((item: any) => ({
              date: item.date || item.originalDate || item._id || 'Unknown',
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
        setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
            <span>Scan Activity Heat Map</span>
          </CardTitle>
          <CardDescription>
            Visual activity patterns over time - darker squares indicate more scans
            {debugInfo && (
              <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                Debug: {debugInfo.activityDataLength} data points
              </span>
            )}
          </CardDescription>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last Year</SelectItem>
          </SelectContent>
        </Select>
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
          <ScanActivityHeatMap scanData={scanActivityData} timeframe={timeframe} />
        )}
      </CardContent>
    </Card>
  )
}

export default ScanActivityAnalytics
