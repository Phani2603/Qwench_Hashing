"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import RouteGuard from "@/components/auth/route-guard"
import { AppSidebar } from "@/components/layout/app-sidebar"
import UserManagement from "@/components/admin/user-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Users, Shield, Activity, Settings, Loader2, TrendingUp, Database, QrCode, Tag } from "lucide-react"
import QRCodeGenerator from "@/components/admin/qr-code-generator"
import CategoryManagement from "@/components/admin/category-management"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

function AdminDashboardContent() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    totalQRCodes: 0,
    totalCategories: 0,
    systemStatus: "Online",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch user stats
        const userResponse = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        let userStats = { totalUsers: 0, adminUsers: 0, regularUsers: 0 }
        if (userResponse.ok) {
          const userData = await userResponse.json()
          userStats = {
            totalUsers: userData.totalUsers || 0,
            adminUsers: userData.adminUsers || 0,
            regularUsers: userData.regularUsers || 0,
          }
        }

        // Fetch QR code stats
        const qrResponse = await fetch(`${API_BASE_URL}/qrcodes/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        let qrStats = { totalQRCodes: 0 }
        if (qrResponse.ok) {
          const qrData = await qrResponse.json()
          qrStats = {
            totalQRCodes: qrData.totalQRCodes || 0,
          }
        } else {
          // Fallback: fetch all QR codes and count them
          const fallbackResponse = await fetch(`${API_BASE_URL}/qrcodes`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            qrStats = {
              totalQRCodes: fallbackData.qrCodes?.length || 0,
            }
          }
        }

        // Fetch category stats
        const categoryResponse = await fetch(`${API_BASE_URL}/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        let categoryStats = { totalCategories: 0 }
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json()
          categoryStats = {
            totalCategories: categoryData.categories?.length || 0,
          }
        }

        setStats({
          ...userStats,
          ...qrStats,
          ...categoryStats,
          systemStatus: "Online",
        })
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchDashboardStats()
    }
  }, [token])

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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              <Shield className="inline-block mr-2 h-8 w-8" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive system administration and management tools. Welcome, {user?.name}.
            </p>
          </div>

          {/* Admin Stats Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-card border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                )}
                <p className="text-xs text-muted-foreground">Registered accounts</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-orange-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-orange-500">{stats.adminUsers}</div>
                )}
                <p className="text-xs text-muted-foreground">Admin accounts</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-blue-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-blue-500">{stats.totalQRCodes}</div>
                )}
                <p className="text-xs text-muted-foreground">Generated codes</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Tag className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-purple-500">{stats.totalCategories}</div>
                )}
                <p className="text-xs text-muted-foreground">Active categories</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.systemStatus}</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          {/* System Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>System Overview</span>
                </CardTitle>
                <CardDescription>Key administrative metrics and system health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Database Status</p>
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">API Status</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
                    <span className="text-sm font-medium">{stats.regularUsers}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Server Uptime</p>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 bg-card">
              <CardHeader>
                <CardTitle>Administrative Tools</CardTitle>
                <CardDescription>Quick access to management functions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Generate and assign QR codes</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Organize resources with categories</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">System configuration and monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Sections */}
          <UserManagement />

          <div className="mt-6">
            <QRCodeGenerator />
          </div>

          <div className="mt-6">
            <CategoryManagement />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AdminDashboardPage() {
  return (
    <RouteGuard requireAuth={true} requireAdmin={true}>
      <AdminDashboardContent />
    </RouteGuard>
  )
}
