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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import {
  QrCode,
  Search,
  MoreHorizontal,
  Trash2,
  Loader2,
  AlertTriangle,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  Eye,
  Smartphone,
  ExternalLink,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface QRCode {
  _id: string
  codeId: string
  imageURL: string
  websiteURL: string
  websiteTitle: string
  assignedTo: {
    _id: string
    name: string
    email: string
  }
  category: {
    _id: string
    name: string
    color: string
  }
  scanCount: number
  createdAt: string
}

interface QRAnalytics {
  totalQRCodes: number
  totalScans: number
  averageScansPerCode: number
  deviceBreakdown: Array<{
    device: string
    count: number
    percentage: number
  }>
  scanTimeline: Array<{
    date: string
    scans: number
  }>
  topPerformingCodes: Array<{
    title: string
    scans: number
    conversionRate: number
  }>
  geographicData: Array<{
    country: string
    scans: number
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

function QRCodeManagementContent() {
  const { token } = useAuth()
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [filteredQrCodes, setFilteredQrCodes] = useState<QRCode[]>([])
  const [analytics, setAnalytics] = useState<QRAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [qrToDelete, setQrToDelete] = useState<QRCode | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [viewQRDialog, setViewQRDialog] = useState(false)
  const [selectedQRDetails, setSelectedQRDetails] = useState<QRCode | null>(null)
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; color: string }>>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = qrCodes.filter(
      (qr) =>
        (qr.websiteTitle?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (qr.websiteURL?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (qr.assignedTo.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )

    if (categoryFilter !== "all") {
      filtered = filtered.filter((qr) => qr.category._id === categoryFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3)
          break
      }

      filtered = filtered.filter((qr) => new Date(qr.createdAt) >= filterDate)
    }

    setFilteredQrCodes(filtered)
  }, [qrCodes, searchTerm, categoryFilter, dateFilter])

  const fetchData = async () => {
    await Promise.all([fetchQRCodes(), fetchCategories(), fetchAnalytics()])
  }

  const fetchQRCodes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/qrcodes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodes(data.qrCodes || [])
      } else {
        setError("Failed to fetch QR codes")
      }
    } catch (err) {
      setError("Error fetching QR codes")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/qrcodes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        console.error("Failed to fetch QR analytics")
      }
    } catch (err) {
      console.error("Error fetching QR analytics:", err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const deleteQRCode = async (codeId: string) => {
    setActionLoading(codeId)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/qrcodes/${codeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setMessage("QR code deleted successfully")
        fetchQRCodes()
        setDeleteDialogOpen(false)
        setQrToDelete(null)
      } else {
        const data = await response.json()
        setError(data.message || "Failed to delete QR code")
      }
    } catch (err) {
      setError("Error deleting QR code")
    } finally {
      setActionLoading(null)
    }
  }

  const exportQRCodes = (format: "csv" | "pdf") => {
    const data = filteredQrCodes.map((qr) => ({
      Title: qr.websiteTitle,
      URL: qr.websiteURL,
      "Assigned To": qr.assignedTo.name,
      Category: qr.category.name,
      Scans: qr.scanCount,
      "Created At": new Date(qr.createdAt).toLocaleDateString(),
      "Code ID": qr.codeId,
    }))

    if (format === "csv") {
      const csv = [Object.keys(data[0]).join(","), ...data.map((row) => Object.values(row).join(","))].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "qr-codes.csv"
      a.click()
    }

    setMessage(`QR codes exported as ${format.toUpperCase()}`)
  }

  const viewQRDetails = (qr: QRCode) => {
    setSelectedQRDetails(qr)
    setViewQRDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading QR code management...</span>
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
                  <BreadcrumbPage>QR Code Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                <QrCode className="inline-block mr-2 h-8 w-8" />
                QR Code Management
              </h1>
              <p className="text-muted-foreground">Comprehensive QR code analytics and performance tracking</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportQRCodes("csv")}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportQRCodes("pdf")}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {(message || error) && (
            <Alert
              variant={error ? "destructive" : "default"}
              className={`${error ? "border-destructive bg-destructive/10" : "border-green-500 bg-green-50 dark:bg-green-950"}`}
            >
              <AlertDescription className={error ? "text-destructive" : "text-green-700 dark:text-green-400"}>
                {message || error}
              </AlertDescription>
            </Alert>
          )}

          {/* Analytics Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQRCodes || 0}</div>
                <p className="text-xs text-muted-foreground">Active QR codes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalScans || 0}</div>
                <p className="text-xs text-muted-foreground">All-time scans</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Scans/Code</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.averageScansPerCode || 0}</div>
                <p className="text-xs text-muted-foreground">Average performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mobile Scans</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.deviceBreakdown.find((d) => d.device === "Mobile")?.percentage || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Of total scans</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Scan Activity Timeline</CardTitle>
                <CardDescription>QR code scan frequency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    scans: {
                      label: "Scans",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.scanTimeline || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="scans" stroke="var(--color-scans)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Scan distribution by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    mobile: {
                      label: "Mobile",
                      color: "hsl(var(--chart-1))",
                    },
                    desktop: {
                      label: "Desktop",
                      color: "hsl(var(--chart-2))",
                    },
                    tablet: {
                      label: "Tablet",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.deviceBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ device, percentage }) => `${device} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics?.deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing QR Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing QR Codes</CardTitle>
              <CardDescription>QR codes with highest scan rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  scans: {
                    label: "Scans",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.topPerformingCodes || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="scans" fill="var(--color-scans)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* QR Codes Table */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code Directory</CardTitle>
              <CardDescription>Search, filter, and manage QR codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search QR codes by title, URL, or assignee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredQrCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || categoryFilter !== "all" || dateFilter !== "all"
                      ? "No QR codes found matching your filters."
                      : "No QR codes found."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Website</th>
                          <th className="text-left py-3 px-4">Assigned To</th>
                          <th className="text-left py-3 px-4">Category</th>
                          <th className="text-left py-3 px-4">Scans</th>
                          <th className="text-left py-3 px-4">Created</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQrCodes.map((qrCode) => (
                          <tr key={qrCode.codeId} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-foreground">{qrCode.websiteTitle}</p>
                                <a
                                  href={qrCode.websiteURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center space-x-1"
                                >
                                  <span>{qrCode.websiteURL}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{qrCode.assignedTo.name}</p>
                                <p className="text-xs text-muted-foreground">{qrCode.assignedTo.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                style={{ borderColor: qrCode.category.color, color: qrCode.category.color }}
                              >
                                {qrCode.category.name}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-green-600">{qrCode.scanCount}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-muted-foreground">
                                {new Date(qrCode.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => viewQRDetails(qrCode)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      {actionLoading === qrCode.codeId ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <MoreHorizontal className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setQrToDelete(qrCode)
                                        setDeleteDialogOpen(true)
                                      }}
                                      disabled={actionLoading === qrCode.codeId}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete QR Code
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span>Delete QR Code</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the QR code for <strong>{qrToDelete?.websiteTitle}</strong>? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => qrToDelete && deleteQRCode(qrToDelete.codeId)}
                disabled={actionLoading === qrToDelete?.codeId}
              >
                {actionLoading === qrToDelete?.codeId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete QR Code"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Details Dialog */}
        <Dialog open={viewQRDialog} onOpenChange={setViewQRDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code Details</DialogTitle>
              <DialogDescription>Detailed analytics for {selectedQRDetails?.websiteTitle}</DialogDescription>
            </DialogHeader>
            {selectedQRDetails && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border flex justify-center">
                  <img
                    src={`${API_BASE_URL}${selectedQRDetails.imageURL}`}
                    alt="QR Code"
                    className="w-32 h-32"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=128&width=128"
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{selectedQRDetails.websiteTitle}</h3>
                    <a
                      href={selectedQRDetails.websiteURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>{selectedQRDetails.websiteURL}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      style={{ borderColor: selectedQRDetails.category.color, color: selectedQRDetails.category.color }}
                    >
                      {selectedQRDetails.category.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Assigned to {selectedQRDetails.assignedTo.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Total Scans</p>
                      <p className="text-lg font-bold text-green-600">{selectedQRDetails.scanCount}</p>
                    </div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-muted-foreground">
                        {new Date(selectedQRDetails.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>Code ID: {selectedQRDetails.codeId}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewQRDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function QRCodeManagementPage() {
  return (
    <RouteGuard requireAuth={true} requireAdmin={true}>
      <QRCodeManagementContent />
    </RouteGuard>
  )
}
