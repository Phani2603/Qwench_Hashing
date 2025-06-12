"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Loader2, AlertCircle, Info as InfoIcon, Flame } from "lucide-react"

interface ScanActivityData {
  date: string
  scans: number
  normalizedDate?: string
}

interface ScanActivityAnalyticsProps {
  token?: string | null
}

// Enhanced GitHub-style heat map with beautiful turquoise/green colors and better alignment
const ScanActivityHeatMap = ({ scanData = [], timeframe = "6months", errorMessage = "" }: { 
  scanData: ScanActivityData[]
  timeframe: string
  errorMessage?: string | null
}) => {
  console.log("📊 Heat map received data:", scanData) // Debug log  
  
  // Generate heat map data with proper date calculations
  const generateHeatMapData = () => {
    const months = timeframe === "12months" ? 12 : 6
    const today = new Date()
    // Use the exact current date with time set to the end of day for proper date range
    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() - months)
    // Set to beginning of day
    startDate.setHours(0, 0, 0, 0)
    // Set today to end of day to include all today's activity
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)
    
    console.log("🗓️ Heat map date range:", startDate.toDateString(), "to", endDate.toDateString())
    console.log("📈 Time range:", timeframe === "12months" ? "Last 12 months" : "Last 6 months")
      
    // Create scan lookup map for efficient access
    const scanMap = new Map()
    console.log("🔍 Parsing scan data:", scanData)
    
    scanData.forEach(item => {
      let dateObj;
      // Handle different date formats
      try {
        // Use normalizedDate if available (more reliable)
        if (item.normalizedDate) {
          console.log(`📊 Processing normalized date: ${item.normalizedDate}`);
          const parts = item.normalizedDate.split('-');
          
          if (parts.length >= 2) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            
            if (parts.length === 2) {
              // For month-only format (2025-6)
              // Use the 15th day of month as representative date
              dateObj = new Date(year, month, 15);
            } else if (parts.length === 3) {
              // For full date format (2025-06-11)
              const day = parseInt(parts[2]);
              dateObj = new Date(year, month, day);
            }
          }
        } else if (typeof item.date === 'string') {
          console.log(`📊 Processing date string: ${item.date}`);
          if (item.date.includes('-')) {
            // If it's already in YYYY-MM-DD format
            dateObj = new Date(item.date);
          } else if (/^\w{3}\s\d{1,2}$/.test(item.date)) {
            // Format like "Jun 10" - assume current year
            const currentYear = new Date().getFullYear();
            dateObj = new Date(`${item.date}, ${currentYear}`);
          } else if (/^\w{3}\s\d{4}$/.test(item.date)) {
            // Format like "Jun 2025" - use 15th as day
            dateObj = new Date(`${item.date} 15`);
          } else {
            // Try general parsing
            dateObj = new Date(item.date);
          }
        }
        
        // Ensure we have a valid date
        if (!dateObj || isNaN(dateObj.getTime())) {
          console.warn(`📅 Invalid date: ${item.date}, normalized: ${item.normalizedDate}`);
          return;
        }
        
        const dateStr = dateObj.toISOString().split('T')[0];
        scanMap.set(dateStr, (parseInt(String(item.scans)) || 0));
        console.log(`✅ Scan data mapped: ${dateStr} = ${item.scans} scans (original: ${item.date})`);
      } catch (err) {
        console.warn(`📅 Error parsing date: ${item.date}`, err);
      }
    });
    
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
        day: current.getDate(),
        dateObj: new Date(current), // Store the actual date object for better formatting
        scanMap: scanMap // Store the scan map for access in the rendering
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return { heatMapData, scanMap, maxScans }
  }
  
  const { heatMapData, scanMap, maxScans } = generateHeatMapData()
  
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

  // Generate month labels with improved positioning and visibility
  const monthLabels: { month: string; position: number }[] = []
  const processedMonths = new Set()
  
  // Calculate appropriate positions for month labels
  heatMapData.forEach((day, index) => {
    // Create a label for the first day of each month
    if (day.day === 1 || (index === 0 && !processedMonths.has(day.month))) {
      // Calculate column position in the grid considering the day of the week offset
      // This ensures alignment with the correct day cell in the heatmap
      const weekIndex = Math.floor((index + heatMapData[0]?.dayOfWeek) / 7)
      
      // Format month label differently based on timeframe
      let monthLabel;
      if (timeframe === "12months") {
        // For yearly view, include the month and shortened year
        monthLabel = day.dateObj.toLocaleDateString('en', { month: 'short', year: '2-digit' })
      } else {
        // For 6-month view, just show the month
        monthLabel = day.dateObj.toLocaleDateString('en', { month: 'short' })
      }
      
      monthLabels.push({
        month: monthLabel,
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
      <div className="w-full">        <div className="mb-6 text-center">          <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
            <span>Scan Activity Heat Map</span>
            <div className="relative ml-2 group">
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 invisible group-hover:visible bg-popover text-popover-foreground p-2 rounded shadow-lg text-xs w-64 z-50">
                This heat map shows your QR code scan activity over time. Each colored square represents scans on a specific day.
              </div>
            </div>
          </h3>          <div className="bg-muted/40 rounded-lg p-4 inline-block mb-3 max-w-md border-l-4 border-l-muted">
            <p className="text-sm font-medium flex items-center">
              {errorMessage?.includes("No QR codes") ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                  <span>No QR codes found</span>
                </>
              ) : (
                <>
                  <InfoIcon className="items-center h-4 w-4 mr-2 text-blue-500" />
                  <span>No scan activity detected yet</span>
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-2 mb-3">
              {errorMessage?.includes("No QR codes") ?
              "Your QR codes are created but haven't been scanned yet. Share your QR codes with others to start building your activity history."
              :
                "You need to have QR codes created for your account before scan activity can be tracked. Contact an administrator to generate QR codes for you." 
                }
            </p>
            <div>
              <a 
                href={errorMessage?.includes("No QR codes") ? "/dashboard?action=request-qr-codes" : "/dashboard?action=view-qr-codes"} 
                className={`text-xs px-3 text-center py-1.5 rounded font-medium inline-flex items-center ${
                  errorMessage?.includes("No QR codes")
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                }`}
              >
                {errorMessage?.includes("No QR codes") ? "Request QR Codes" : "View My QR Codes"}
                <span className="ml-1">→</span>
              </a>
            </div>
          </div>
        </div>
        
        {/* Empty heat map structure */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border overflow-x-auto">
          <div className="flex flex-col items-center mb-4">
            {errorMessage?.includes("No QR codes") ? (
              <div className="bg-muted/40 rounded-full p-3 mb-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
            ) : (
              <div className="bg-muted/40 rounded-full p-3 mb-3 relative">
                <Activity className="h-8 w-8 text-muted-foreground/50" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-20"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-300/40"></span>
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-2 sm:gap-4 min-w-[640px] opacity-50">
            {/* Weekday labels */}
            <div className="flex flex-col gap-1 pt-6 sm:pt-8">
              {weekdays.map((day, index) => (
                <div key={day} className={`text-xs text-muted-foreground h-3 flex items-center ${index % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}>
                  {index % 2 === 0 ? day.slice(0, 3) : ''}
                </div>
              ))}
            </div>
            
            {/* Heat map grid */}
            <div className="flex-1 min-w-0">
              {/* Month labels */}
              <div className="h-6 sm:h-8 mb-1 flex items-center">
                <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${Math.min(weeks.length, 24)}, minmax(12px, 1fr))` }}>
                  {/* Create month dividers for better visual guidance */}
                  {monthLabels.map((label, index) => (
                    <div 
                      key={index} 
                      className="text-xs text-muted-foreground font-medium relative"
                      style={{ gridColumnStart: label.position + 1 }}
                    >
                      <div className="absolute -bottom-1 left-0 w-px h-2 bg-border"></div>
                      <span className="bg-card px-0.5 relative z-10">{label.month}</span>
                    </div>
                  ))}
                </div>
              </div>
                {/* Grid */}
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(weeks.length, 24)}, minmax(12px, 1fr))` }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={dayIndex} className="w-3 h-3" />
                      }
                      
                      // Format full date string for tooltip
                      const dateStr = day.dateObj.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                      
                      // Check if this is today's date
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isToday = today.getTime() === new Date(day.dateObj).setHours(0, 0, 0, 0);
                      
                      // Define recent activity (within last 7 days)
                      const sevenDaysAgo = new Date(today);
                      sevenDaysAgo.setDate(today.getDate() - 7);
                      const dayDate = new Date(day.dateObj);
                      dayDate.setHours(0, 0, 0, 0);
                      const isRecentActivity = day.scans > 0 && !isToday && dayDate >= sevenDaysAgo;
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`
                            w-3 h-3 rounded-sm
                            transition-all duration-300
                            ${getIntensityColor(day.intensity)}
                            ${day.scans > 0 ? 'hover:scale-125 hover:z-10 hover:ring-2 hover:ring-teal-400/70' : ''}
                            ${isToday ? 'ring-2 ring-primary' : ''}
                            ${isRecentActivity ? 'ring-1 ring-amber-400' : ''}
                          `}
                          title={`${dateStr}: ${day.scans} ${day.scans === 1 ? 'scan' : 'scans'}`}
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
    <div className="w-full">      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 rounded-lg border border-teal-200 dark:border-teal-800 hover:shadow-md hover:shadow-teal-200/20 dark:hover:shadow-teal-900/30 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-center items-center gap-2">
            <div className="text-lg sm:text-2xl font-bold text-teal-700 dark:text-teal-300">{totalScans}</div>
            {totalScans > 0 && <span className="text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 px-1 py-0.5 rounded">100%</span>}
          </div>          <div className="text-xs text-teal-600 dark:text-teal-400 flex items-center justify-center gap-1 group relative">
            <Activity className="h-3 w-3" />
            <span>Total Scans</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 invisible group-hover:visible bg-popover text-popover-foreground text-[10px] p-1 rounded shadow-lg w-40 z-10">
              Total number of QR code scans across all your codes
            </div>
          </div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:shadow-md hover:shadow-emerald-200/20 dark:hover:shadow-emerald-900/30 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-center items-center gap-2">
            <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{activeDays}</div>
            {activeDays > 0 && totalScans > 0 && (
              <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded">
                {Math.round((activeDays / (timeframe === '12months' ? 365 : 180)) * 100)}%
              </span>
            )}
          </div>          <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 group relative">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Active Days</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 invisible group-hover:visible bg-popover text-popover-foreground text-[10px] p-1 rounded shadow-lg w-40 z-10">
              Total days with at least one scan recorded
            </div>
          </div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:shadow-md hover:shadow-cyan-200/20 dark:hover:shadow-cyan-900/30 transition-all duration-300 animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <div className="flex justify-center items-center gap-2">
            <div className="text-lg sm:text-2xl font-bold text-cyan-700 dark:text-cyan-300">{peakActivity}</div>
            {peakActivity > 0 && totalScans > 0 && (
              <span className="text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1 py-0.5 rounded">
                {Math.round((peakActivity / totalScans) * 100)}% max
              </span>
            )}
          </div>          <div className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-1 group relative">
            <Flame className="h-3 w-3" />
            <span>Peak Activity</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 invisible group-hover:visible bg-popover text-popover-foreground text-[10px] p-1 rounded shadow-lg w-40 z-10">
              Highest number of scans in a single day
            </div>
          </div>
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
              <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(12px, 1fr))` }}>                {monthLabels.map((label, index) => (
                  <div 
                    key={index} 
                    className="text-xs text-muted-foreground font-medium relative"
                    style={{ gridColumnStart: label.position + 1 }}
                  >
                    <div className="absolute -bottom-1 left-0 w-px h-2 bg-border"></div>
                    <span className="bg-card px-0.5 relative z-10">{label.month}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Date grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(12px, 1fr))` }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="w-3 h-3" />
                    }
                    
                    // Format full date string for tooltip
                    const dateStr = day.dateObj.toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                    
                    // Check if this is today's date
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday = today.getTime() === new Date(day.dateObj).setHours(0, 0, 0, 0);
                    
                    // Find if this is the most recent day with activity
                    // Define the time window for "recent activity" - 7 days
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);
                    
                    // Logic for highlighting recent activity:
                    // 1. Has scans
                    // 2. Not today
                    // 3. Within the last 7 days
                    const dayDate = new Date(day.dateObj);
                    dayDate.setHours(0, 0, 0, 0);
                    
                    const isRecentActivityDay = 
                      day.scans > 0 && 
                      !isToday && 
                      dayDate >= sevenDaysAgo
                    
                    return (                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded-sm cursor-pointer transition-all duration-300 hover:scale-125 hover:z-10
                          hover:ring-2 hover:ring-teal-400/70 hover:ring-opacity-70
                          animate-fadeIn
                          ${isToday ? 'ring-2 ring-primary' : ''}
                          ${isRecentActivityDay ? 'ring-1 ring-amber-400' : ''}
                          ${getIntensityColor(day.intensity)}
                        `}
                        style={{ animationDelay: `${(weekIndex * 7 + dayIndex) * 5}ms` }}
                        title={`${dateStr}: ${day.scans} ${day.scans === 1 ? 'scan' : 'scans'}${isToday ? ' (Today)' : ''}${isRecentActivityDay ? ' (Recent activity)' : ''}`}
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
              {[0, 1, 2, 3, 4].map(level => {
                const tooltipText = level === 0 ? 'No activity' : 
                  level === 1 ? '1-25% of peak' :
                  level === 2 ? '26-50% of peak' :
                  level === 3 ? '51-75% of peak' : '76-100% of peak';
                  
                return (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(level)} cursor-help relative group`}
                    title={tooltipText}
                  >
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground rounded text-[10px] invisible group-hover:visible w-28 text-center shadow-lg z-10">
                      {tooltipText}
                    </span>
                  </div>
                );
              })}
            </div>
            <span>More</span>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-medium text-teal-600 dark:text-teal-400 flex items-center justify-center sm:justify-end gap-1">
              <InfoIcon className="h-3 w-3 text-teal-500 mr-1" />
              <span>{timeframe === '12months' ? 'Last 12 months' : 'Last 6 months'} • {totalScans} total scans</span>
            </div>            <div className="text-muted-foreground">
              Peak: {peakActivity} scans • Active: {activeDays} days ({
                activeDays > 0 ? 
                Math.round((activeDays / heatMapData.length) * 100) : 0
              }% activity rate)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ScanActivityAnalytics: React.FC<ScanActivityAnalyticsProps> = ({ token }) => {
  const [timeframe, setTimeframe] = useState("12months")
  const [scanActivityData, setScanActivityData] = useState<ScanActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    useEffect(() => {
    const fetchScanActivity = async () => {
      console.log("🔄 Fetching scan activity..."); // Debug log
      console.log("🔧 Token present:", !!token); // Debug log
      console.log("🌐 API URL:", API_BASE_URL); // Debug log
      console.log("📅 Timeframe:", timeframe); // Debug log
      
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      if (!token) {
        console.log("❌ No token provided");
        setError("Authentication required");
        setLoading(false);
        return;
      }
      
      try {
        // Convert timeframe to backend format - properly handle different time ranges
        // Fix the API timeframe parameter to correctly differentiate between 6 months and yearly views
        const backendTimeframe = timeframe === '6months' ? 'monthly' : 'yearly';
        const url = `${API_BASE_URL}/analytics/activity?timeframe=${backendTimeframe}`;
        console.log("📡 Fetching from:", url); // Debug log
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📨 Response status:", response.status); // Debug log
        console.log("📨 Response headers:", Object.fromEntries(response.headers.entries())); // Debug log
        
        if (response.ok) {
          const data = await response.json();
          console.log("📦 Response data:", data); // Debug log
          
          // Enhanced debug information
          setDebugInfo({
            status: response.status,
            dataKeys: Object.keys(data),
            hasActivityData: !!data.activityData,
            activityDataLength: data.activityData?.length || 0,
            qrCodeCount: data.qrCodeCount || 0,
            timeframeInfo: {
              requested: timeframe,
              backend: backendTimeframe
            },
            dateRange: {
              start: new Date(new Date().setMonth(new Date().getMonth() - (timeframe === '12months' ? 12 : 6))).toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0]
            },
            apiUrl: url
          });

          if (data.success && Array.isArray(data.activityData)) {
            // Ensure data is properly formatted for heat map and sort by date
            const formattedData = data.activityData
              .map((item: any) => {
                // Capture all possible date formats
                const dateValue = item.date || item.originalDate || item._id || 'Unknown';
                // Parse scan count reliably
                const scanCount = parseInt(item.scans) || parseInt(item.count) || 0;
                
                // Create a normalized date for proper sorting
                let normalizedDate;
                
                // Handle different date formats from API
                if (item.originalDate && typeof item.originalDate === 'string' && item.originalDate.includes('-')) {
                  normalizedDate = item.originalDate;
                } else if (typeof dateValue === 'string' && dateValue.includes('-')) {
                  normalizedDate = dateValue;
                } else if (typeof dateValue === 'string') {
                  // Try to parse date formats like "Jun 2023" or "Week 24, 2023"
                  try {
                    const parsedDate = new Date(dateValue);
                    if (!isNaN(parsedDate.getTime())) {
                      normalizedDate = parsedDate.toISOString().split('T')[0];
                    }
                  } catch (e) {
                    console.warn(`Failed to parse date: ${dateValue}`);
                    normalizedDate = null;
                  }
                }
                
                return {
                  date: dateValue,
                  scans: scanCount,
                  normalizedDate
                };
              })
              // Sort by date to ensure proper timeline display
              .sort((a: any, b: any) => {
                if (a.normalizedDate && b.normalizedDate) {
                  return a.normalizedDate.localeCompare(b.normalizedDate);
                }
                return 0;
              });
            
            console.log("✅ Formatted data:", formattedData) // Debug log
            setScanActivityData(formattedData)              // Check if there's no data to display
              if (formattedData.length === 0) {
                // Check if the response contains info about QR codes
                if (data.qrCodeCount === 0) {
                  setError("No QR codes found - please add QR codes first")
                } else {
                  setError(`No scan activity found for the selected timeframe (${timeframe === '6months' ? 'last 6 months' : 'last year'})`)
                }
            }
          } else {
            console.error("❌ Invalid response format:", data)
            setError("Received invalid data format from server")
          }
        } else {
          const errorText = await response.text();
          console.error("❌ API Error:", response.status, errorText); // Debug log
          setError(`Failed to load data (${response.status})`);
        }
      } catch (err) {
        console.error("❌ Network error:", err); // Debug log
        setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
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
        </div >
        {/*
        >div className ="hidden sm:block"> 
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last Year</SelectItem>
          </SelectContent>
        </Select>
        </div>
        */}
      </CardHeader>
            <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 h-[250px]">
            <Loader2 className="h-8 w-8 animate-spin mr-3 text-teal-600" />
            <span className="text-muted-foreground">Loading scan activity...</span>
          </div>
        ) : error ? (
          <ScanActivityHeatMap scanData={[]} timeframe={timeframe} errorMessage={error} />
        ) : (
          <ScanActivityHeatMap scanData={scanActivityData} timeframe={timeframe} />
        )}
        
        {/* Enhanced Debug Panel with more useful diagnostic information */}
        {/* {debugInfo && (
          <div className="mt-6 border border-border rounded-lg p-3 bg-muted/20 text-xs">
            <details className="text-muted-foreground">
              <summary className="cursor-pointer flex items-center font-medium">
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded mr-2 font-mono">DEBUG</span>
                <span>Diagnostic Information</span>
              </summary>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card p-2 rounded border">
                    <h4 className="font-semibold mb-1 text-[11px] uppercase text-muted-foreground">Response</h4>
                    <div className="space-y-1 font-mono">
                      <div>Status: <span className="text-teal-600 dark:text-teal-400">{debugInfo.status}</span></div>
                      <div>Data Points: <span className="text-teal-600 dark:text-teal-400">{debugInfo.activityDataLength || 0}</span></div>
                      <div>QR Codes: <span className="text-teal-600 dark:text-teal-400">{debugInfo.qrCodeCount || 0}</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-card p-2 rounded border">
                    <h4 className="font-semibold mb-1 text-[11px] uppercase text-muted-foreground">Timeframe</h4>
                    <div className="space-y-1 font-mono">
                      <div>UI Setting: <span className="text-teal-600 dark:text-teal-400">{timeframe}</span></div>
                      <div>API Parameter: <span className="text-teal-600 dark:text-teal-400">{timeframe === '6months' ? 'monthly' : 'yearly'}</span></div>
                      <div>Date Range: <span className="text-teal-600 dark:text-teal-400">{timeframe === '6months' ? '6 months' : '12 months'}</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card p-2 rounded border">
                    <h4 className="font-semibold mb-1 text-[11px] uppercase text-muted-foreground">Data Keys</h4>
                    <div className="flex flex-wrap gap-1">
                      {debugInfo.dataKeys?.map((key: string) => (
                        <span key={key} className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">{key}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-card p-2 rounded border">
                    <h4 className="font-semibold mb-1 text-[11px] uppercase text-muted-foreground">Data Sample</h4>
                    <div className="overflow-hidden">
                      {scanActivityData.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <div>First data: <span className="text-teal-600 dark:text-teal-400 font-mono">{JSON.stringify(scanActivityData[0]).substring(0, 30)}...</span></div>
                          <div>Last data: <span className="text-teal-600 dark:text-teal-400 font-mono">{JSON.stringify(scanActivityData[scanActivityData.length-1]).substring(0, 30)}...</span></div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No data available</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-2 rounded border">
                  <h4 className="font-semibold mb-1 text-[11px] uppercase text-muted-foreground">Raw Debug Info</h4>
                  <pre className="bg-slate-950 p-2 rounded text-[10px] overflow-auto max-h-40 text-slate-300 font-mono">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
                
                <div className="text-center">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-[10px] bg-muted px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            </details>
          </div>
        )} */}
      </CardContent>
    </Card>
  )
}

export default ScanActivityAnalytics