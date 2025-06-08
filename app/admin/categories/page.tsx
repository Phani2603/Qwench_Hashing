"use client"

import type React from "react"

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
import { Textarea } from "@/components/ui/textarea"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Plus,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface Category {
  _id: string
  name: string
  description?: string
  color: string
  isActive: boolean
  createdBy: {
    name: string
  }
  createdAt: string
  qrCodeCount?: number
  totalScans?: number
}

interface CategoryAnalytics {
  totalCategories: number
  activeCategories: number
  totalQRCodes: number
  categoryDistribution: Array<{
    name: string
    color: string
    count: number
    percentage: number
  }>
  performanceMetrics: Array<{
    name: string
    qrCodes: number
    scans: number
    avgScansPerCode: number
  }>
  utilizationTrends: Array<{
    month: string
    categories: number
    usage: number
  }>
}

const colorOptions = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#F97316",
  "#06B6D4",
  "#84CC16",
  "#EC4899",
  "#6B7280",
  "#14B8A6",
  "#F472B6",
  "#A855F7",
  "#22C55E",
  "#EAB308",
]

function CategoryManagementContent() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [analytics, setAnalytics] = useState<CategoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchCategories(), fetchAnalytics()])
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
        setCategories(data.categories)
      } else {
        setError("Failed to fetch categories")
      }
    } catch (err) {
      setError("Error fetching categories")
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
        // Update categories with counts from analytics
        if (data.categoriesWithCounts) {
          setCategories(data.categoriesWithCounts)
        }
      } else {
        console.error("Failed to fetch category analytics")
      }
    } catch (err) {
      console.error("Error fetching category analytics:", err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    setSuccess("")

    try {
      const url = editingCategory ? `${API_BASE_URL}/categories/${editingCategory._id}` : `${API_BASE_URL}/categories`
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingCategory ? "Category updated successfully" : "Category created successfully")
        fetchData()
        resetForm()
      } else {
        setError(data.message || "Failed to save category")
      }
    } catch (err) {
      setError("Error saving category")
    } finally {
      setCreating(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Category deleted successfully")
        fetchData()
      } else {
        setError(data.message || "Failed to delete category")
      }
    } catch (err) {
      setError("Error deleting category")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6",
    })
    setEditingCategory(null)
    setShowCreateDialog(false)
  }

  const startEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
    })
    setEditingCategory(category)
    setShowCreateDialog(true)
  }

  const exportCategories = (format: "csv" | "pdf") => {
    const data = categories.map((category) => ({
      Name: category.name,
      Description: category.description || "",
      Color: category.color,
      Status: category.isActive ? "Active" : "Inactive",
      "QR Codes": category.qrCodeCount || 0,
      "Total Scans": category.totalScans || 0,
      "Created By": category.createdBy.name,
      "Created At": new Date(category.createdAt).toLocaleDateString(),
    }))

    if (format === "csv") {
      const csv = [Object.keys(data[0]).join(","), ...data.map((row) => Object.values(row).join(","))].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "categories.csv"
      a.click()
    }

    setSuccess(`Categories exported as ${format.toUpperCase()}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading category management...</span>
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
                  <BreadcrumbPage>Category Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                <Tag className="inline-block mr-2 h-8 w-8" />
                Category Management
              </h1>
              <p className="text-muted-foreground">Organize and analyze QR code categories with detailed metrics</p>
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
                  <DropdownMenuItem onClick={() => exportCategories("csv")}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportCategories("pdf")}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
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

          {/* Analytics Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalCategories || 0}</div>
                <p className="text-xs text-muted-foreground">Active categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeCategories || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics ? Math.round((analytics.activeCategories / analytics.totalCategories) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQRCodes || 0}</div>
                <p className="text-xs text-muted-foreground">Across all categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per Category</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics && analytics.totalCategories > 0
                    ? Math.round(analytics.totalQRCodes / analytics.totalCategories)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">QR codes per category</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Category Performance Metrics</CardTitle>
                <CardDescription>QR codes and scan performance by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    qrCodes: {
                      label: "QR Codes",
                      color: "hsl(var(--chart-1))",
                    },
                    scans: {
                      label: "Total Scans",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.performanceMetrics || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="qrCodes" fill="var(--color-qrCodes)" />
                      <Bar dataKey="scans" fill="var(--color-scans)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>QR code distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    distribution: {
                      label: "Distribution",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics?.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Categories Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Category Directory</CardTitle>
              <CardDescription>Manage and organize your QR code categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No categories have been created yet.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <Card key={category._id} className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => startEdit(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteCategory(category._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">QR Codes:</span>
                            <Badge variant="outline">{category.qrCodeCount || 0}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Scans:</span>
                            <Badge variant="outline">{category.totalScans || 0}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={category.isActive ? "default" : "secondary"}>
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                          Created by {category.createdBy.name} on {formatDate(category.createdAt)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Category Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update the category details" : "Add a new category for organizing QR codes"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Books, Water Bottles"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? "border-foreground" : "border-muted"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingCategory ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingCategory ? "Update Category" : "Create Category"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function CategoryManagementPage() {
  return (
    <RouteGuard requireAuth={true} requireAdmin={true}>
      <CategoryManagementContent />
    </RouteGuard>
  )
}
