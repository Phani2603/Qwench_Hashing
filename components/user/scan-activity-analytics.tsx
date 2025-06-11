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

// Enhanced GitHub-style heat map with beautiful turquoise/green colors and better alignment
const ScanActivityHeatMap = ({ scanData = [], timeframe = "6months" }: { 
  scanData: ScanActivityData[] 
  timeframe: string 
}) => {
  console.log("📊 Heat map received data:", scanData) // Debug log

  // Generate heat map data with proper date calculations
  const generateHeatMapData = () => {
    const months = timeframe === "12months" ? 12 : 6
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1)
    
    // Create scan lookup map for efficient access
    const scanMap = new Map()
    scanData.forEach(item => {
      const dateStr = new Date(item.date).toISOString().split('T')[0]
      scanMap.set(dateStr, (item.scans || 0))
    })
    
    // Find max scans for color scaling
    const maxScans = Math.max(...Array.from(scanMap.values()), 1)
    
    // Generate all dates in the range
    const heatMapData = []
    const current = new Date(startDate)
    
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0]
      const scans = scanMap.get(dateStr) || 0
      
      // Calculate intensity level (0-4) with beautiful scaling
      let intensity = 0
      if (scans > 0) {
        const ratio = scans / maxScans
        if (ratio >= 0.8) intensity = 4
        else if (ratio >= 0.6) intensity = 3
        else if (ratio >= 0.4) intensity = 2
        else intensity = 1
      }
      
      heatMapData.push({
        date: dateStr,
        scans,
        intensity,
        dayOfWeek: current.getDay(),
        month: current.getMonth(),
        day: current.getDate()
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return heatMapData
  }
  
  const heatMapData = generateHeatMapData()
  
  // Group data by weeks for proper grid layout
  const weeks: (any | null)[][] = []
  let currentWeek: (any | null)[] = []
  
  heatMapData.forEach((day, index) => {
    if (index === 0) {
      // Add empty cells for the first week to align with day of week
      for (let i = 0; i < day.dayOfWeek; i++) {
        currentWeek.push(null)
      }
    }
    
    currentWeek.push(day)
    
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  // Add remaining days to last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }
  
  // Generate month labels with proper positioning
  const monthLabels: { month: string; position: number }[] = []
  const processedMonths = new Set()
  
  heatMapData.forEach((day, index) => {
    if (day.day === 1 && !processedMonths.has(day.month)) {
      const weekIndex = Math.floor((index + (heatMapData[0]?.dayOfWeek || 0)) / 7)
      monthLabels.push({
        month: new Date(2024, day.month).toLocaleDateString('en', { month: 'short' }),
        position: weekIndex
      })
      processedMonths.add(day.month)
    }
  })
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Calculate statistics
  const totalScans = heatMapData.reduce((sum, day) => sum + day.scans, 0)
  const activeDays = heatMapData.filter(day => day.scans > 0).length
  const peakActivity = Math.max(...heatMapData.map(day => day.scans))
  
  // Get intensity color classes with beautiful turquoise/green theme
  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50'
      case 1: return 'bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50'
      case 2: return 'bg-teal-300 dark:bg-teal-700/60 border border-teal-400 dark:border-teal-600'
      case 3: return 'bg-teal-500 dark:bg-teal-600 border border-teal-600 dark:border-teal-500'
      case 4: return 'bg-teal-700 dark:bg-teal-500 border border-teal-800 dark:border-teal-400'
      default: return 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50'
    }
  }
  
  // Show heat map even with no data
  if (totalScans === 0) {
    return (
      <div className="w-full">
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Scan Activity Heat Map</h3>
          <p className="text-sm text-muted-foreground">
            No scan activity yet - start scanning QR codes to see your activity pattern!
          </p>
        </div>
        
        {/* Empty heat map structure */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border overflow-x-auto">
          <div className="flex items-start gap-2 sm:gap-4 min-w-[640px]">
            {/* Weekday labels */}
            <div className="flex flex-col gap-1 pt-6 sm:pt-8">
              {weekdays.map((day, index) => (
                <div key={day} className={`text-xs text-muted-foreground h-3 flex items-center ${index % 2 === 1 ? 'opacity-100' : 'opacity-0'}`}>
                  {index % 2 === 1 ? day.slice(0, 3) : ''}
                </div>
              ))}
            </div>
            
            {/* Heat map grid */}
            <div className="flex-1 min-w-0">
              {/* Month labels */}
              <div className="h-6 sm:h-8 mb-1 flex items-center">
                <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${Math.min(weeks.length, 24)}, minmax(12px, 1fr))` }}>
                  {Array.from({ length: Math.min(weeks.length, 24) }, (_, weekIndex) => (
                    <div key={weekIndex} className="text-xs text-muted-foreground text-center">
                      {weekIndex % 4 === 0 ? 'Jan' : ''}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Grid */}
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(weeks.length, 24)}, minmax(12px, 1fr))` }}>
                {Array.from({ length: Math.min(weeks.length, 24) }, (_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }, (_, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
                        title="No activity"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(intensity => (
                  <div
                    key={intensity}
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
            <div className="text-center sm:text-right">
              <div>Ready to track your scan activity</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 rounded-lg border border-teal-200 dark:border-teal-800">
          <div className="text-lg sm:text-2xl font-bold text-teal-700 dark:text-teal-300">{totalScans}</div>
          <div className="text-xs text-teal-600 dark:text-teal-400">Total Scans</div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{activeDays}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">Active Days</div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <div className="text-lg sm:text-2xl font-bold text-cyan-700 dark:text-cyan-300">{peakActivity}</div>
          <div className="text-xs text-cyan-600 dark:text-cyan-400">Peak Activity</div>
        </div>
      </div>

      {/* Heat Map */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 overflow-x-auto">
        <div className="flex items-start gap-2 sm:gap-4 min-w-[640px]">
          {/* Weekday labels */}
          <div className="flex flex-col gap-1 pt-6 sm:pt-8 flex-shrink-0">
            {weekdays.map((day, index) => (
              <div key={day} className={`text-xs text-muted-foreground h-3 flex items-center w-8 ${index % 2 === 1 ? 'opacity-100' : 'opacity-0'}`}>
                {index % 2 === 1 ? day.slice(0, 3) : ''}
              </div>
            ))}
          </div>
          
          {/* Heat map grid */}
          <div className="flex-1 min-w-0">
            {/* Month labels */}
            <div className="h-6 sm:h-8 mb-1 flex items-center">
              <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(12px, 1fr))` }}>
                {monthLabels.map((label, index) => (
                  <div 
                    key={index} 
                    className="text-xs text-muted-foreground text-left"
                    style={{ gridColumnStart: label.position + 1 }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Date grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(12px, 1fr))` }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="w-3 h-3" />
                    }
                    
                    const dateStr = new Date(day.date).toLocaleDateString()
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:ring-2 hover:ring-teal-400 hover:ring-opacity-50
                          ${getIntensityColor(day.intensity)}
                        `}
                        title={`${dateStr}: ${day.scans} scans`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-medium text-teal-600 dark:text-teal-400">
              {timeframe === '12months' ? 'Last 12 months' : 'Last 6 months'} • {totalScans} total scans
            </div>
            <div className="text-muted-foreground">
              Peak: {peakActivity} scans • Active: {activeDays} days
            </div>
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
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-teal-600" />
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
            <Loader2 className="h-8 w-8 animate-spin mr-3 text-teal-600" />
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
