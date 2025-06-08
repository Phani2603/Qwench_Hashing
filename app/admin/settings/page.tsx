"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import RouteGuard from "@/components/auth/route-guard"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Settings, Loader2, Save, RefreshCw, Clock, HardDrive, Cpu, Globe, Download } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface SystemMetrics {
  uptime: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  activeConnections: number
  requestsPerMinute: number
  errorRate: number
  responseTime: number
  dbStats: any
  performanceData: Array<{
    time: string
    cpu: number
    memory: number
    requests: number
  }>
  featureUsage: Array<{
    feature: string
    usage: number
    trend: number
  }>
  auditLogs: Array<{
    id: string
    timestamp: string
    user: string
    action: string
    resource: string
    ipAddress: string
  }>
  auditLogsPagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
  backups?: Array<{
    id: string
    timestamp: string
    size: string
    type: string
    status: string
  }>
  certificates?: Array<{
    _id?: string
    id?: string
    name: string
    commonName: string
    issuer?: string
    expiryDate: string
    certificateFile?: string
    keyFile?: string
  }>
  systemSettings?: {
    security?: SecuritySettings
    backup?: BackupSettings
  }
}

interface IPRestriction {
  _id?: string
  ipAddress: string
  description?: string
  isAllowed: boolean
  createdAt?: string
  updatedAt?: string
}

interface BackupSettings {
  autoBackupEnabled: boolean
  backupSchedule: "daily" | "weekly" | "monthly"
  backupTime: string
  retentionDays: number
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  requireSpecialChars: boolean
  apiRateLimit: number
  ipRestrictions: {
    enabled: boolean
    allowedIPs: IPRestriction[]
    blockedIPs: IPRestriction[]
  }
  sslEnabled: boolean
  certificateExpiry?: string
}

function SystemSettingsContent() {
  const { token, user } = useAuth()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChars: true,
    apiRateLimit: 1000,
    ipRestrictions: {
      enabled: false,
      allowedIPs: [],
      blockedIPs: []
    },
    sslEnabled: false,
  })
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackupEnabled: false,
    backupSchedule: "weekly",
    backupTime: "00:00",
    retentionDays: 30
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [auditLogFilters, setAuditLogFilters] = useState({
    user: "",
    action: "",
    resource: "",
    startDate: "",
    endDate: "",
  })
  const [auditLogsPage, setAuditLogsPage] = useState(1)
  const [selectedTab, setSelectedTab] = useState("performance")
  const [newBackupName, setNewBackupName] = useState("")
  const [newBackupType, setNewBackupType] = useState("Full")
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [newIPAddress, setNewIPAddress] = useState("")
  const [newIPDescription, setNewIPDescription] = useState("")
  const [newIPAllow, setNewIPAllow] = useState(true)
  const [isAddingIP, setIsAddingIP] = useState(false)
  const [newCertificateInfo, setNewCertificateInfo] = useState({
    name: "",
    commonName: "",
    issuer: "",
    expiryDate: "",
  })
  const [isAddingCertificate, setIsAddingCertificate] = useState(false)

  useEffect(() => {
    fetchSystemData()
    // Set up auto-refresh every 60 seconds for real-time data
    const interval = setInterval(fetchSystemData, 600000)
    return () => clearInterval(interval)
  }, [])
  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",        },
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        
        // If we have system settings from the backend, use them
        if (data.metrics.systemSettings) {
          if (data.metrics.systemSettings.security) {
            setSecuritySettings(data.metrics.systemSettings.security)
          }
          if (data.metrics.systemSettings.backup) {
            setBackupSettings(data.metrics.systemSettings.backup)
          }
        }
        
        // Fetch the initial page of audit logs with pagination
        await fetchInitialAuditLogs()
      } else {
        setError("Failed to fetch system metrics")
      }
    } catch (err) {
      setError("Error fetching system data")
    } finally {
      setLoading(false)
    }
  }

  const fetchInitialAuditLogs = async () => {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append("page", "1")
      queryParams.append("limit", "15")
      
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/audit-logs?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.auditLogs) {
        setMetrics((prev) => prev ? { 
          ...prev, 
          auditLogs: data.auditLogs,
          auditLogsPagination: data.pagination
        } : null)
        setAuditLogsPage(1)
      }
    } catch (err) {
      console.error("Error fetching initial audit logs:", err)
    }  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSystemData()
    setRefreshing(false)
  }

  const saveSecuritySettings = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ securitySettings }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Security settings updated successfully")
        fetchSystemData() // Refresh data after saving
      } else {
        setError(data.message || "Failed to save security settings")
      }
    } catch (err) {
      setError("Error saving security settings")
    } finally {
      setSaving(false)
    }
  }
  
  const saveBackupSettings = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/backup-settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ backupSettings }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Backup settings updated successfully")
        fetchSystemData() // Refresh data after saving
      } else {
        setError(data.message || "Failed to save backup settings")
      }
    } catch (err) {
      setError("Error saving backup settings")
    } finally {
      setSaving(false)
    }
  }
  const exportAuditLogs = async () => {
    setSuccess("")
    setError("")
    
    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams()
      if (auditLogFilters.user) queryParams.append("user", auditLogFilters.user)
      if (auditLogFilters.action) queryParams.append("action", auditLogFilters.action)
      if (auditLogFilters.resource) queryParams.append("resource", auditLogFilters.resource)
      if (auditLogFilters.startDate) queryParams.append("startDate", auditLogFilters.startDate)
      if (auditLogFilters.endDate) queryParams.append("endDate", auditLogFilters.endDate)
      
      // Create a download link to the export endpoint
      const exportUrl = `${API_BASE_URL}/admin/analytics/system/audit-logs/export?${queryParams.toString()}`
      
      // Create an invisible anchor and click it to trigger the download
      const a = document.createElement("a")
      a.href = exportUrl
      a.download = "audit-logs.csv"
      
      // Add authorization header by creating a fetch, then getting the blob URL
      const response = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error("Failed to export audit logs")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      a.href = url
      a.click()
      
      setSuccess("Audit logs exported successfully")
    } catch (err) {
      setError("Error exporting audit logs")
    }
  }

  const getStatusColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return "text-red-600"
    if (value >= thresholds.warning) return "text-yellow-600"
    return "text-green-600"
  }

  const addIPRestriction = async () => {
    if (!newIPAddress) {
      setError("IP address is required")
      return
    }
    
    setIsAddingIP(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/ip-restrictions/ip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ipAddress: newIPAddress,
          description: newIPDescription,
          isAllowed: newIPAllow,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`IP address ${newIPAddress} ${newIPAllow ? "allowed" : "blocked"} successfully`)
        setNewIPAddress("")
        setNewIPDescription("")
        fetchSystemData() // Refresh data
      } else {
        setError(data.message || "Failed to add IP restriction")
      }
    } catch (err) {
      setError("Error adding IP restriction")
    } finally {
      setIsAddingIP(false)
    }
  }
  
  const removeIPRestriction = async (ipAddress: string, isAllowed: boolean) => {
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/ip-restrictions/ip`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ipAddress,
          isAllowed,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`IP address ${ipAddress} removed successfully`)
        fetchSystemData() // Refresh data
      } else {
        setError(data.message || "Failed to remove IP restriction")
      }
    } catch (err) {
      setError("Error removing IP restriction")
    }
  }
  
  const createBackup = async () => {
    if (!newBackupName) {
      setError("Backup name is required")
      return
    }
    
    setIsCreatingBackup(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/backups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newBackupName,
          type: newBackupType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Backup created successfully")
        setNewBackupName("")
        fetchSystemData() // Refresh data
      } else {
        setError(data.message || "Failed to create backup")
      }
    } catch (err) {
      setError("Error creating backup")
    } finally {
      setIsCreatingBackup(false)
    }
  }
  
  const deleteBackup = async (id: string) => {
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/backups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Backup deleted successfully")
        fetchSystemData() // Refresh data
      } else {
        setError(data.message || "Failed to delete backup")
      }
    } catch (err) {
      setError("Error deleting backup")
    }
  }
  
  const addCertificate = async () => {
    if (!newCertificateInfo.name || !newCertificateInfo.commonName || !newCertificateInfo.expiryDate) {
      setError("Certificate name, common name and expiry date are required")
      return
    }
    
    setIsAddingCertificate(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/certificates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCertificateInfo),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Certificate added successfully")
        setNewCertificateInfo({
          name: "",
          commonName: "",
          issuer: "",
          expiryDate: "",
        })
        fetchSystemData() // Refresh data
      } else {
        setError(data.message || "Failed to add certificate")
      }
    } catch (err) {
      setError("Error adding certificate")
    } finally {
      setIsAddingCertificate(false)
    }
  }
    const deleteCertificate = async (id: string | undefined) => {
    if (!id) {
      setError("Certificate ID is required")
      return
    }
    
    setError("")
    setSuccess("")
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/certificates/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Certificate deleted successfully")
        fetchSystemData() // Refresh data
      } else {
        setError(data.message || "Failed to delete certificate")
      }
    } catch (err) {
      setError("Error deleting certificate")
    }
  }
    const fetchFilteredAuditLogs = async (page = 1) => {
    setLoading(true)
    setError("")
    
    try {
      const queryParams = new URLSearchParams()
      if (auditLogFilters.user) queryParams.append("user", auditLogFilters.user)
      if (auditLogFilters.action) queryParams.append("action", auditLogFilters.action)
      if (auditLogFilters.resource) queryParams.append("resource", auditLogFilters.resource)
      if (auditLogFilters.startDate) queryParams.append("startDate", auditLogFilters.startDate)
      if (auditLogFilters.endDate) queryParams.append("endDate", auditLogFilters.endDate)
      queryParams.append("page", page.toString())
      queryParams.append("limit", "15")
      
      const response = await fetch(`${API_BASE_URL}/admin/analytics/system/audit-logs?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.auditLogs) {
        setMetrics((prev) => prev ? { 
          ...prev, 
          auditLogs: data.auditLogs,
          auditLogsPagination: data.pagination
        } : null)
        setAuditLogsPage(page)
      } else {
        setError(data.message || "Failed to fetch audit logs")
      }
    } catch (err) {
      setError("Error fetching audit logs")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading system settings...</span>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>System Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                <Settings className="inline-block mr-2 h-8 w-8" />
                System Settings
              </h1>
              <p className="text-muted-foreground">Monitor system performance and configure security settings</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={exportAuditLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>

          {(error || success) && (
            <Alert
              variant={error ? "destructive" : "default"}
              className={`${error ? "border-destructive bg-destructive/10" : "border-green-500 bg-green-50 dark:bg-green-950"}`}
            >
              <AlertDescription className={error ? "text-destructive" : "text-green-700 dark:text-green-400"}>
                {error || success}
              </AlertDescription>
            </Alert>
          )}

          {/* System Metrics Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics?.uptime}</div>
                <p className="text-xs text-muted-foreground">Server running time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getStatusColor(metrics?.cpuUsage || 0, { warning: 70, danger: 90 })}`}
                >
                  {metrics?.cpuUsage}%
                </div>
                <p className="text-xs text-muted-foreground">Current load</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getStatusColor(metrics?.memoryUsage || 0, { warning: 80, danger: 95 })}`}
                >
                  {metrics?.memoryUsage}%
                </div>
                <p className="text-xs text-muted-foreground">RAM utilization</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeConnections}</div>
                <p className="text-xs text-muted-foreground">Current sessions</p>
              </CardContent>
            </Card>
          </div>          <Tabs 
            defaultValue="performance" 
            className="space-y-4" 
            value={selectedTab} 
            onValueChange={(value) => {
              setSelectedTab(value);
              if (value === "audit") {
                fetchFilteredAuditLogs();
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              <TabsTrigger value="backups">Backups</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              {/* Performance Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance (24h)</CardTitle>
                    <CardDescription>CPU and memory usage over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        cpu: {
                          label: "CPU Usage",
                          color: "hsl(var(--chart-1))",
                        },
                        memory: {
                          label: "Memory Usage",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics?.performanceData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="cpu" stroke="var(--color-cpu)" strokeWidth={2} />
                          <Line type="monotone" dataKey="memory" stroke="var(--color-memory)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Request Volume</CardTitle>
                    <CardDescription>API requests per hour</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        requests: {
                          label: "Requests",
                          color: "hsl(var(--chart-3))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics?.performanceData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="requests"
                            stroke="var(--color-requests)"
                            fill="var(--color-requests)"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Real-time system performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Requests/Min</p>
                      <div className="text-2xl font-bold">{metrics?.requestsPerMinute}</div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                      <div className="text-2xl font-bold text-green-600">{metrics?.errorRate}%</div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                      <div className="text-2xl font-bold">{metrics?.responseTime}ms</div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Disk Usage</p>
                      <div className="text-2xl font-bold">{metrics?.diskUsage}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Configuration</CardTitle>
                  <CardDescription>Manage system security settings and policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                        </div>
                        <Switch
                          checked={securitySettings.twoFactorEnabled}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({ ...prev, twoFactorEnabled: checked }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={securitySettings.sessionTimeout}
                          onChange={(e) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              sessionTimeout: Number.parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                        <Input
                          id="maxLoginAttempts"
                          type="number"
                          value={securitySettings.maxLoginAttempts}
                          onChange={(e) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              maxLoginAttempts: Number.parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                        <Input
                          id="passwordMinLength"
                          type="number"
                          value={securitySettings.passwordMinLength}
                          onChange={(e) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              passwordMinLength: Number.parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require Special Characters</Label>
                          <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                        </div>
                        <Switch
                          checked={securitySettings.requireSpecialChars}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({ ...prev, requireSpecialChars: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>IP Restrictions</Label>
                          <p className="text-sm text-muted-foreground">Restrict access by IP address</p>
                        </div>
                        <Switch
                          checked={securitySettings.ipRestrictions?.enabled}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              ipRestrictions: {
                                ...prev.ipRestrictions,
                                enabled: checked,
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                        <Input
                          id="apiRateLimit"
                          type="number"
                          value={securitySettings.apiRateLimit}
                          onChange={(e) =>
                            setSecuritySettings((prev) => ({ ...prev, apiRateLimit: Number.parseInt(e.target.value) }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* IP Restrictions Section */}
                  {securitySettings.ipRestrictions?.enabled && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">IP Address Management</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Allowed IPs</CardTitle>
                            <CardDescription>IP addresses that are explicitly allowed</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <Label htmlFor="new-ip-address">IP Address</Label>
                                  <Input
                                    id="new-ip-address"
                                    value={newIPAddress}
                                    onChange={(e) => setNewIPAddress(e.target.value)}
                                    placeholder="192.168.1.1"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor="new-ip-description">Description</Label>
                                  <Input
                                    id="new-ip-description"
                                    value={newIPDescription}
                                    onChange={(e) => setNewIPDescription(e.target.value)}
                                    placeholder="Office network"
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    setNewIPAllow(true)
                                    addIPRestriction()
                                  }}
                                  disabled={isAddingIP || !newIPAddress}
                                >
                                  {isAddingIP ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                                </Button>
                              </div>
                              
                              {/* List of allowed IPs */}
                              <div className="overflow-auto max-h-64">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2">IP Address</th>
                                      <th className="text-left py-2">Description</th>
                                      <th className="text-right py-2">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {securitySettings.ipRestrictions?.allowedIPs?.map((ip, index) => (
                                      <tr key={index} className="border-b">
                                        <td className="py-2">{ip.ipAddress}</td>
                                        <td className="py-2">{ip.description || "-"}</td>
                                        <td className="py-2 text-right">
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeIPRestriction(ip.ipAddress, true)}
                                          >
                                            Remove
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}                                    {(!securitySettings.ipRestrictions?.allowedIPs ||
                                      securitySettings.ipRestrictions?.allowedIPs.length === 0) && (
                                      <tr key="no-allowed-ips">
                                        <td colSpan={3} className="py-4 text-center text-muted-foreground">
                                          No allowed IPs configured
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Blocked IPs</CardTitle>
                            <CardDescription>IP addresses that are explicitly blocked</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <Label htmlFor="new-blocked-ip">IP Address</Label>
                                  <Input
                                    id="new-blocked-ip"
                                    value={newIPAddress}
                                    onChange={(e) => setNewIPAddress(e.target.value)}
                                    placeholder="192.168.1.100"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor="new-blocked-desc">Description</Label>
                                  <Input
                                    id="new-blocked-desc"
                                    value={newIPDescription}
                                    onChange={(e) => setNewIPDescription(e.target.value)}
                                    placeholder="Suspicious activity"
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    setNewIPAllow(false)
                                    addIPRestriction()
                                  }}
                                  disabled={isAddingIP || !newIPAddress}
                                >
                                  {isAddingIP ? <Loader2 className="h-4 w-4 animate-spin" /> : "Block"}
                                </Button>
                              </div>
                              
                              {/* List of blocked IPs */}
                              <div className="overflow-auto max-h-64">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2">IP Address</th>
                                      <th className="text-left py-2">Description</th>
                                      <th className="text-right py-2">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {securitySettings.ipRestrictions?.blockedIPs?.map((ip, index) => (
                                      <tr key={index} className="border-b">
                                        <td className="py-2">{ip.ipAddress}</td>
                                        <td className="py-2">{ip.description || "-"}</td>
                                        <td className="py-2 text-right">
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeIPRestriction(ip.ipAddress, false)}
                                          >
                                            Remove
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}                                    {(!securitySettings.ipRestrictions?.blockedIPs ||
                                      securitySettings.ipRestrictions?.blockedIPs.length === 0) && (
                                      <tr key="no-blocked-ips">
                                        <td colSpan={3} className="py-4 text-center text-muted-foreground">
                                          No blocked IPs configured
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={saveSecuritySettings} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage Analytics</CardTitle>
                  <CardDescription>Monitor platform feature adoption and usage patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.featureUsage.map((feature) => (
                      <div key={feature.feature} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{feature.feature}</p>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${feature.usage}%` }} />
                            </div>
                            <span className="text-sm text-muted-foreground">{feature.usage}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={feature.trend > 0 ? "default" : "secondary"}>
                            {feature.trend > 0 ? "+" : ""}
                            {feature.trend}%
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">vs last month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>System activity and security audit trail</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filtering options */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="filter-user">User</Label>
                        <Input
                          id="filter-user"
                          value={auditLogFilters.user}
                          onChange={(e) => setAuditLogFilters((prev) => ({ ...prev, user: e.target.value }))}
                          placeholder="Filter by user email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-action">Action</Label>
                        <Input
                          id="filter-action"
                          value={auditLogFilters.action}
                          onChange={(e) => setAuditLogFilters((prev) => ({ ...prev, action: e.target.value }))}
                          placeholder="Filter by action type"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-resource">Resource</Label>
                        <Input
                          id="filter-resource"
                          value={auditLogFilters.resource}
                          onChange={(e) => setAuditLogFilters((prev) => ({ ...prev, resource: e.target.value }))}
                          placeholder="Filter by resource"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-start-date">Start Date</Label>
                        <Input
                          id="filter-start-date"
                          type="date"
                          value={auditLogFilters.startDate}
                          onChange={(e) => setAuditLogFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-end-date">End Date</Label>
                        <Input
                          id="filter-end-date"
                          type="date"
                          value={auditLogFilters.endDate}
                          onChange={(e) => setAuditLogFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>                      <div className="flex items-end">
                        <Button onClick={() => fetchFilteredAuditLogs(1)}>
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Timestamp</th>
                            <th className="text-left py-3 px-4">User</th>
                            <th className="text-left py-3 px-4">Action</th>
                            <th className="text-left py-3 px-4">Resource</th>
                            <th className="text-left py-3 px-4">IP Address</th>
                          </tr>
                        </thead> 
                        <tbody>
                          {!metrics?.auditLogs || metrics.auditLogs.length === 0 ? (
                            <tr key="no-audit-logs">
                              <td colSpan={5} className="py-4 text-center text-muted-foreground">
                                No audit logs found
                              </td>
                            </tr>
                          ) : (                            metrics.auditLogs.map((log, index) => (
                              <tr key={log.id || `audit-log-${index}`} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-medium">{log.user}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline">{log.action}</Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm">{log.resource}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-muted-foreground">{log.ipAddress}</span>
                                </td>
                              </tr>                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {metrics?.auditLogsPagination && metrics.auditLogsPagination.pages > 1 && (
                      <div className="flex justify-center mt-6">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => auditLogsPage > 1 && fetchFilteredAuditLogs(auditLogsPage - 1)}
                                className={auditLogsPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            
                            {/* Page Numbers */}
                            {[...Array(metrics.auditLogsPagination.pages)].map((_, i) => {
                              const pageNum = i + 1
                              const isCurrentPage = pageNum === auditLogsPage
                              
                              // Show first page, last page, current page, and pages around current
                              if (
                                pageNum === 1 ||
                                pageNum === metrics.auditLogsPagination!.pages ||
                                (pageNum >= auditLogsPage - 1 && pageNum <= auditLogsPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      onClick={() => fetchFilteredAuditLogs(pageNum)}
                                      isActive={isCurrentPage}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                )
                              }
                              
                              // Show ellipsis for gaps
                              if (pageNum === auditLogsPage - 2 || pageNum === auditLogsPage + 2) {
                                return (
                                  <PaginationItem key={`ellipsis-${pageNum}`}>
                                    <span className="px-3 py-2">...</span>
                                  </PaginationItem>
                                )
                              }
                              
                              return null
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => auditLogsPage < metrics.auditLogsPagination!.pages && fetchFilteredAuditLogs(auditLogsPage + 1)}
                                className={auditLogsPage >= metrics.auditLogsPagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                    
                    {/* Pagination Info */}
                    {metrics?.auditLogsPagination && (
                      <div className="text-sm text-muted-foreground text-center mt-4">
                        Showing {((auditLogsPage - 1) * 15) + 1} to {Math.min(auditLogsPage * 15, metrics.auditLogsPagination.total)} of {metrics.auditLogsPagination.total} audit logs
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>            <TabsContent value="backups" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Backup Management</CardTitle>
                  <CardDescription>Configure and monitor system backups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Backup Configuration */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Backup Configuration</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Automatic Backups</Label>
                              <p className="text-sm text-muted-foreground">Schedule regular system backups</p>
                            </div>
                            <Switch
                              checked={backupSettings.autoBackupEnabled}
                              onCheckedChange={(checked) =>
                                setBackupSettings((prev) => ({ ...prev, autoBackupEnabled: checked }))
                              }
                            />
                          </div>

                          {backupSettings.autoBackupEnabled && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="backupSchedule">Backup Frequency</Label>
                                <select
                                  id="backupSchedule"
                                  value={backupSettings.backupSchedule}
                                  onChange={(e) =>
                                    setBackupSettings((prev) => ({
                                      ...prev,
                                      backupSchedule: e.target.value as "daily" | "weekly" | "monthly",
                                    }))
                                  }
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="backupTime">Backup Time</Label>
                                <Input
                                  id="backupTime"
                                  type="time"
                                  value={backupSettings.backupTime}
                                  onChange={(e) =>
                                    setBackupSettings((prev) => ({ ...prev, backupTime: e.target.value }))
                                  }
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="space-y-4">
                          {backupSettings.autoBackupEnabled && (
                            <div className="space-y-2">
                              <Label htmlFor="retentionDays">Retention Period (days)</Label>
                              <Input
                                id="retentionDays"
                                type="number"
                                value={backupSettings.retentionDays}
                                onChange={(e) =>
                                  setBackupSettings((prev) => ({
                                    ...prev,
                                    retentionDays: parseInt(e.target.value),
                                  }))
                                }
                                min={1}
                              />
                              <p className="text-xs text-muted-foreground">
                                Backups older than this period will be automatically deleted
                              </p>
                            </div>
                          )}
                          <div className="pt-4">
                            <Button onClick={saveBackupSettings} disabled={saving}>
                              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                              Save Settings
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manual Backup */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-3">Create Manual Backup</h3>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label htmlFor="new-backup-name">Backup Name</Label>
                          <Input
                            id="new-backup-name"
                            value={newBackupName}
                            onChange={(e) => setNewBackupName(e.target.value)}
                            placeholder="Weekly Backup - June 2025"
                          />
                        </div>
                        <div className="w-40">
                          <Label htmlFor="new-backup-type">Type</Label>
                          <select
                            id="new-backup-type"
                            value={newBackupType}
                            onChange={(e) => setNewBackupType(e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="Full">Full Backup</option>
                            <option value="Database">Database Only</option>
                            <option value="Configurations">Configurations</option>
                          </select>
                        </div>
                        <Button onClick={createBackup} disabled={isCreatingBackup || !newBackupName}>
                          {isCreatingBackup ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Create Backup
                        </Button>
                      </div>
                    </div>

                    {/* Backup History */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-3">Backup History</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {!metrics?.backups || metrics.backups.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No backups found</p>
                        ) : (
                          metrics.backups.map((backup) => (
                            <Card key={backup.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div>
                                  <CardTitle className="text-sm font-medium">{backup.type}</CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(backup.timestamp).toLocaleDateString()} at {new Date(backup.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                                <Badge variant={backup.status === "Completed" ? "default" : backup.status === "Failed" ? "destructive" : "secondary"}>
                                  {backup.status}
                                </Badge>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">{backup.size}</div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => deleteBackup(backup.id)}>
                                    Delete
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>            <TabsContent value="certificates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SSL Certificates</CardTitle>
                  <CardDescription>Manage SSL certificates for secure connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* SSL Configuration */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">SSL Configuration</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable SSL</Label>
                          <p className="text-sm text-muted-foreground">Use secure HTTPS connections</p>
                        </div>
                        <Switch
                          checked={securitySettings.sslEnabled}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({ ...prev, sslEnabled: checked }))
                          }
                        />
                      </div>
                    </div>

                    {/* Add New Certificate */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-3">Add Certificate</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="cert-name">Certificate Name</Label>
                            <Input
                              id="cert-name"
                              value={newCertificateInfo.name}
                              onChange={(e) => setNewCertificateInfo((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="Production SSL"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cert-common-name">Common Name (Domain)</Label>
                            <Input
                              id="cert-common-name"
                              value={newCertificateInfo.commonName}
                              onChange={(e) => setNewCertificateInfo((prev) => ({ ...prev, commonName: e.target.value }))}
                              placeholder="example.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="cert-issuer">Issuer</Label>
                            <Input
                              id="cert-issuer"
                              value={newCertificateInfo.issuer}
                              onChange={(e) => setNewCertificateInfo((prev) => ({ ...prev, issuer: e.target.value }))}
                              placeholder="Let's Encrypt"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cert-expiry">Expiry Date</Label>
                            <Input
                              id="cert-expiry"
                              type="date"
                              value={newCertificateInfo.expiryDate}
                              onChange={(e) => setNewCertificateInfo((prev) => ({ ...prev, expiryDate: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-4 items-center">
                        <div className="flex-1">
                          <Label htmlFor="cert-file">Certificate File (CRT)</Label>
                          <Input id="cert-file" type="file" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="key-file">Private Key File</Label>
                          <Input id="key-file" type="file" />
                        </div>
                        <Button 
                          onClick={addCertificate} 
                          disabled={isAddingCertificate || !newCertificateInfo.name || !newCertificateInfo.commonName || !newCertificateInfo.expiryDate}
                          className="mt-6"
                        >
                          {isAddingCertificate ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Add Certificate
                        </Button>
                      </div>
                    </div>

                    {/* Certificates List */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-3">Certificates</h3>
                      <div className="grid gap-4 md:grid-cols-2">                        {!metrics?.certificates || metrics.certificates.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No certificates found</p>
                        ) : (
                          metrics.certificates.map((cert, index) => {
                            const expiryDate = new Date(cert.expiryDate);
                            const now = new Date();
                            const daysDiff = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            const isExpiringSoon = daysDiff <= 30;
                            const isExpired = daysDiff <= 0;
                            
                            return (
                              <Card key={cert._id || cert.id || `cert-${index}`} className={`hover:shadow-md transition-shadow ${isExpired ? 'border-red-500' : isExpiringSoon ? 'border-yellow-500' : ''}`}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <div>
                                    <CardTitle className="text-sm font-medium">{cert.name}</CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                      {cert.commonName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Issued by: {cert.issuer || "Self-signed"}
                                    </p>
                                  </div>
                                  {isExpired ? (
                                    <Badge variant="destructive">Expired</Badge>
                                  ) : isExpiringSoon ? (
                                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                      Expires in {daysDiff} days
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-green-500 text-green-600">
                                      Valid
                                    </Badge>
                                  )}
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm">
                                    <span className="font-medium">Expires:</span>{" "}
                                    {new Date(cert.expiryDate).toLocaleDateString()}
                                  </p>
                                  <div className="flex items-center gap-2 mt-4">
                                    <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => deleteCertificate(cert._id || cert.id)}>
                                      Delete
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function SystemSettingsPage() {
  return (
    <RouteGuard requireAuth={true} requireAdmin={true}>
      <SystemSettingsContent />
    </RouteGuard>
  )
}
