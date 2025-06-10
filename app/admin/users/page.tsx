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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Users,
  Search,
  MoreHorizontal,
  UserCheck,
  Shield,
  Trash2,
  Loader2,
  AlertTriangle,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface User {
  _id: string
  name: string
  email: string
  role: "user" | "admin"
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  loginHistory?: Array<{
    timestamp: string
    ipAddress: string
    userAgent: string
  }>
}

interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  regularUsers: number
  userGrowth: Array<{
    date: string
    users: number
    newUsers: number
  }>
  roleDistribution: Array<{
    role: string
    count: number
    percentage: number
  }>
  activityStats: Array<{
    period: string
    activeUsers: number
    totalLogins: number
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

function UserManagementContent() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [viewUserDialog, setViewUserDialog] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedUserForEmail, setSelectedUserForEmail] = useState<User | null>(null)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [emailSending, setEmailSending] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchAnalytics()
  }, [])

  useEffect(() => {
    let filtered = users.filter(
      (user) =>
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => (statusFilter === "active" ? user.isActive : !user.isActive))
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  // Email functionality
  const sendEmailToUser = async (user: User) => {
    setSelectedUserForEmail(user)
    setEmailSubject(`Message from ${currentUser?.name || 'Admin'}`)
    setEmailBody(`Hello ${user.name},\n\nThis is a message from the administration team.\n\nBest regards,\nAdmin Team`)
    setEmailDialogOpen(true)
  }

  const handleSendEmail = async () => {
    if (!selectedUserForEmail || !emailSubject.trim() || !emailBody.trim()) {
      setError("Please fill in all email fields")
      return
    }

    setEmailSending(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUserForEmail._id}/email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailBody,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Email sent successfully to ${selectedUserForEmail.name}`)
        setEmailDialogOpen(false)
        setSelectedUserForEmail(null)
        setEmailSubject("")
        setEmailBody("")
      } else {
        setError(data.message || "Failed to send email")
      }
    } catch (err) {
      setError("Error sending email")
    } finally {
      setEmailSending(false)
    }
  }

  // Pagination functions
  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        setError("Failed to fetch users")
      }
    } catch (err) {
      setError("Error fetching users")
    } finally {
      setLoading(false)
    }
  }
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        console.error("Failed to fetch user analytics")
      }
    } catch (err) {
      console.error("Error fetching analytics:", err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchUsers(), fetchAnalytics()])
    setRefreshing(false)
  }

  const updateUserRole = async (userId: string, newRole: "user" | "admin") => {
    setActionLoading(userId)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`User role updated to ${newRole}`)
        fetchUsers()
        fetchAnalytics()
      } else {
        setError(data.message || "Failed to update user role")
      }
    } catch (err) {
      setError("Error updating user role")
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string) => {
    setActionLoading(userId)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("User deleted successfully")
        fetchUsers()
        fetchAnalytics()
        setDeleteDialogOpen(false)
        setUserToDelete(null)
      } else {
        setError(data.message || "Failed to delete user")
      }
    } catch (err) {
      setError("Error deleting user")
    } finally {
      setActionLoading(null)
    }
  }

  const exportUsers = (format: "csv" | "pdf") => {
    // Mock export functionality
    const data = filteredUsers.map((user) => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.isActive ? "Active" : "Inactive",
      "Created At": new Date(user.createdAt).toLocaleDateString(),
      "Last Login": user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
    }))

    if (format === "csv") {
      const csv = [Object.keys(data[0]).join(","), ...data.map((row) => Object.values(row).join(","))].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "users.csv"
      a.click()
    }

    setMessage(`Users exported as ${format.toUpperCase()}`)
  }

  const viewUserDetails = (user: User) => {
    setSelectedUserDetails(user)
    setViewUserDialog(true)
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const canModifyUser = (user: User) => {
    return currentUser?.id !== user._id && currentUser?.role === "admin"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading user management...</span>
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
                  <BreadcrumbPage>User Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                <Users className="inline-block mr-2 h-8 w-8" />
                User Management
              </h1>
              <p className="text-muted-foreground">Comprehensive user analytics and management tools</p>
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
                  <DropdownMenuItem onClick={() => exportUsers("csv")}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportUsers("pdf")}>Export as PDF</DropdownMenuItem>
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
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.userGrowth && analytics.userGrowth.length > 1
                    ? `+${analytics.userGrowth[analytics.userGrowth.length - 1].newUsers} from last month`
                    : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics ? Math.round((analytics.activeUsers / analytics.totalUsers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.adminUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics ? Math.round((analytics.adminUsers / analytics.totalUsers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.userGrowth && analytics.userGrowth.length > 0
                    ? analytics.userGrowth[analytics.userGrowth.length - 1].newUsers
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.userGrowth && analytics.userGrowth.length > 1
                    ? `${
                        analytics.userGrowth[analytics.userGrowth.length - 1].newUsers >
                        analytics.userGrowth[analytics.userGrowth.length - 2].newUsers
                          ? "+"
                          : ""
                      }${Math.round(
                        ((analytics.userGrowth[analytics.userGrowth.length - 1].newUsers -
                          analytics.userGrowth[analytics.userGrowth.length - 2].newUsers) /
                          analytics.userGrowth[analytics.userGrowth.length - 2].newUsers) *
                          100,
                      )}% from last month`
                    : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>User Growth Over Time</CardTitle>
                <CardDescription>Monthly user registration and growth trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    users: {
                      label: "Total Users",
                      color: "hsl(var(--chart-1))",
                    },
                    newUsers: {
                      label: "New Users",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} />
                      <Line type="monotone" dataKey="newUsers" stroke="var(--color-newUsers)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>User roles across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    users: {
                      label: "Users",
                      color: "hsl(var(--chart-1))",
                    },
                    admins: {
                      label: "Admins",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.roleDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ role, percentage }) => `${role} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics?.roleDistribution.map((entry, index) => (
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

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Search, filter, and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Administrators</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "No users found matching your filters."
                      : "No users found."}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">User</th>
                            <th className="text-left py-3 px-4">Role</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Last Login</th>
                            <th className="text-left py-3 px-4">Created</th>
                            <th className="text-left py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentUsers.map((user) => (
                            <tr key={user._id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-foreground">{getInitials(user.name)}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                  {user.role === "admin" ? "Administrator" : "User"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={user.isActive ? "default" : "destructive"}>
                                  {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-muted-foreground">
                                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-muted-foreground">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => viewUserDetails(user)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => sendEmailToUser(user)}>
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  {canModifyUser(user) && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">Open menu</span>
                                          {actionLoading === user._id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <MoreHorizontal className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {user.role === "user" ? (
                                          <DropdownMenuItem
                                            onClick={() => updateUserRole(user._id, "admin")}
                                            disabled={actionLoading === user._id}
                                          >
                                            <Shield className="mr-2 h-4 w-4" />
                                            Promote to Admin
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() => updateUserRole(user._id, "user")}
                                            disabled={actionLoading === user._id}
                                          >
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Demote to User
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setUserToDelete(user)
                                            setDeleteDialogOpen(true)
                                          }}
                                          disabled={actionLoading === user._id}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete User
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span>Delete User</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => userToDelete && deleteUser(userToDelete._id)}
                disabled={actionLoading === userToDelete?._id}
              >
                {actionLoading === userToDelete?._id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={viewUserDialog} onOpenChange={setViewUserDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Detailed information for {selectedUserDetails?.name}</DialogDescription>
            </DialogHeader>
            {selectedUserDetails && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-foreground">{getInitials(selectedUserDetails.name)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedUserDetails.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUserDetails.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={selectedUserDetails.role === "admin" ? "default" : "secondary"}>
                        {selectedUserDetails.role === "admin" ? "Administrator" : "User"}
                      </Badge>
                      <Badge variant={selectedUserDetails.isActive ? "default" : "destructive"}>
                        {selectedUserDetails.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground">
                      {new Date(selectedUserDetails.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Last Login</p>
                    <p className="text-muted-foreground">
                      {selectedUserDetails.lastLogin
                        ? new Date(selectedUserDetails.lastLogin).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-muted-foreground">
                      {new Date(selectedUserDetails.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">User ID</p>
                    <p className="text-muted-foreground text-xs">{selectedUserDetails._id}</p>
                  </div>
                </div>

                {selectedUserDetails.loginHistory && selectedUserDetails.loginHistory.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Login History</p>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                      {selectedUserDetails.loginHistory.map((login, index) => (
                        <div key={index} className="text-xs border-b last:border-0 py-2">
                          <p className="font-medium">{new Date(login.timestamp).toLocaleString()}</p>
                          <p className="text-muted-foreground">IP: {login.ipAddress}</p>
                          <p className="text-muted-foreground truncate max-w-[250px]">{login.userAgent}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewUserDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Send Email</span>
              </DialogTitle>
              <DialogDescription>
                Send an email to {selectedUserForEmail?.name} ({selectedUserForEmail?.email})
              </DialogDescription>
            </DialogHeader>
            {selectedUserForEmail && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Enter your message"
                    className="mt-1 resize-none"
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
              >
                {emailSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function UserManagementPage() {
  return (
    <RouteGuard requireAuth={true} requireAdmin={true}>
      <UserManagementContent />
    </RouteGuard>
  )
}
