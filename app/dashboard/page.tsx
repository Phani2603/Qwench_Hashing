"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import RouteGuard from "@/components/auth/route-guard"
import { AppSidebar } from "@/components/layout/app-sidebar"
import QRCodeList from "@/components/user/qr-code-list"
import WebsiteURLManager from "@/components/user/website-url-manager"
import QRCodeAnalytics from "@/components/user/qr-code-analytics"
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
import { User, Settings, Calendar, QrCode, Shield, Loader2, Activity } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface UserQRCode {
  _id: string
  codeId: string
  category: {
    name: string
    color: string
  }
  scanCount: number
  createdAt: string
}

function UserDashboardContent() {
  const { user, token, isAdmin } = useAuth()
  const [userInfo, setUserInfo] = useState({
    lastLogin: new Date().toISOString(),
    accountCreated: new Date().toISOString(),
    role: user?.role || "user",
  })
  const [userQRCodes, setUserQRCodes] = useState<UserQRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [qrLoading, setQrLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Fetch user profile data
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUserInfo({
              lastLogin: data.user.lastLogin || new Date().toISOString(),
              accountCreated: data.user.createdAt || new Date().toISOString(),
              role: data.user.role || "user",
            })
          }
        } else {
          console.error("Failed to fetch user profile")
        }
      } catch (err) {
        console.error("Error fetching user profile:", err)
      } finally {
        setLoading(false)
      }
    }

    const fetchUserQRCodes = async () => {
      if (!token || !user?._id) {
        setQrLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/qrcodes/user/${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUserQRCodes(data.qrCodes || [])
        } else {
          console.error("Failed to fetch user QR codes")
        }
      } catch (err) {
        console.error("Error fetching user QR codes:", err)
      } finally {
        setQrLoading(false)
      }
    }

    if (token) {
      fetchUserData()
      fetchUserQRCodes()
    }
  }, [token, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTotalScans = () => {
    return userQRCodes.reduce((total, qr) => total + qr.scanCount, 0)
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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome, {user?.name || "User"}</h1>
            <p className="text-muted-foreground">Here's an overview of your account and QR code activity.</p>
          </div>

          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account Type</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold capitalize">{userInfo.role}</div>
                )}
                <p className="text-xs text-muted-foreground">{isAdmin ? "Administrator access" : "Standard user"}</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {qrLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{userQRCodes.length}</div>
                )}
                <p className="text-xs text-muted-foreground">Assigned to you</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {qrLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-lg font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{getTotalScans()}</div>
                )}
                <p className="text-xs text-muted-foreground">Across all your QR codes</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-bold">Loading...</span>
                  </div>
                ) : (
                  <div className="text-sm font-medium">{formatDate(userInfo.accountCreated)}</div>
                )}
                <p className="text-xs text-muted-foreground">Account creation date</p>
              </CardContent>
            </Card>
          </div>

          {/* Website URL Management Section */}
          <WebsiteURLManager />

          {/* QR Code Management Section */}
          <QRCodeList />
          
          {/* QR Code Analytics Section */}
          <QRCodeAnalytics token={token} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-3 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Manage your account and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <a
                    href="/profile"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Update Profile</p>
                      <p className="text-sm text-muted-foreground">Change your personal information</p>
                    </div>
                  </a>

                  <a
                    href="/settings"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Settings className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Account Settings</p>
                      <p className="text-sm text-muted-foreground">Manage preferences and security</p>
                    </div>
                  </a>

                  {isAdmin && (
                    <a
                      href="/admin/dashboard"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-primary/20"
                    >
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Admin Dashboard</p>
                        <p className="text-sm text-muted-foreground">Access administrative tools</p>
                      </div>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-4 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>QR Code Summary</span>
                </CardTitle>
                <CardDescription>Overview of your QR code activity</CardDescription>
              </CardHeader>
              <CardContent>
                {qrLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading QR code data...</span>
                  </div>
                ) : userQRCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No QR codes have been assigned to you yet.</p>
                    <p className="text-sm">
                      Add your website URLs and contact your administrator for QR code generation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userQRCodes.slice(0, 3).map((qrCode) => (
                      <div
                        key={qrCode._id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: qrCode.category.color }} />
                          <div>
                            <p className="font-medium">{qrCode.category.name}</p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {qrCode.codeId.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{qrCode.scanCount} scans</p>
                          <p className="text-sm text-muted-foreground">Created: {formatDate(qrCode.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {userQRCodes.length > 3 && (
                      <p className="text-center text-sm text-muted-foreground">
                        And {userQRCodes.length - 3} more QR codes...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Status Card */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>Your account details and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg font-medium">{user?.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                  <p className="text-lg font-medium">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-lg font-medium text-green-600 dark:text-green-400">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function UserDashboardPage() {
  return (
    <RouteGuard requireAuth={true}>
      <UserDashboardContent />
    </RouteGuard>
  )
}
