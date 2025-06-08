"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QrCode, Loader2, RefreshCw, Plus, X, Eye, Trash2, ExternalLink } from "lucide-react"
import QRAnalytics from "./qr-analytics"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface User {
  _id: string
  name: string
  email: string
  role: string
  websiteURLs: {
    _id: string
    title: string
    url: string
    description?: string
  }[]
}

interface Category {
  _id: string
  name: string
  color: string
}

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

export default function QRCodeGenerator() {
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [filteredQrCodes, setFilteredQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [currentQR, setCurrentQR] = useState<QRCode | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null)
  const [selectedWebsiteURL, setSelectedWebsiteURL] = useState("")
  const [loadingUserDetails, setLoadingUserDetails] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchCategories()
    fetchQRCodes()
  }, [])

  useEffect(() => {
    if (categoryFilter === "all") {
      setFilteredQrCodes(qrCodes)
    } else {
      setFilteredQrCodes(qrCodes.filter((qr) => qr.category._id === categoryFilter))
    }
  }, [qrCodes, categoryFilter])

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
        // Filter to only show regular users (not admins)
        const regularUsers = data.users.filter((user: User) => user.role === "user")
        setUsers(regularUsers)
      } else {
        setError("Failed to fetch users")
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Error fetching users")
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
      } else {
        setError("Failed to fetch categories")
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Error fetching categories")
    }
  }

  const fetchQRCodes = async () => {
    setLoading(true)
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
        console.error("Failed to fetch QR codes")
        setError("Failed to fetch QR codes")
      }
    } catch (err) {
      console.error("Error fetching QR codes:", err)
      setError("Error fetching QR codes")
    } finally {
      setLoading(false)
    }
  }

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return

    setCreatingCategory(true)
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          color: "#3B82F6",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchCategories()
        setSelectedCategory(data.category._id)
        setNewCategoryName("")
        setShowNewCategoryInput(false)
        setSuccess("Category created successfully")
      } else {
        setError(data.message || "Failed to create category")
      }
    } catch (err) {
      console.error("Error creating category:", err)
      setError("Error creating category")
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchQRCodes()
    setRefreshing(false)
  }

  const fetchUserDetails = async (userId: string) => {
    if (!userId) {
      setSelectedUserDetails(null)
      setSelectedWebsiteURL("")
      return
    }

    setLoadingUserDetails(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedUserDetails(data.user)
      } else {
        setError("Failed to fetch user details")
      }
    } catch (err) {
      console.error("Error fetching user details:", err)
      setError("Error fetching user details")
    } finally {
      setLoadingUserDetails(false)
    }
  }

  const handleUserSelection = (userId: string) => {
    setSelectedUser(userId)
    setSelectedWebsiteURL("")
    fetchUserDetails(userId)
  }

  const generateQRCode = async () => {
    if (!selectedUser) {
      setError("Please select a user")
      return
    }

    if (!selectedCategory) {
      setError("Please select a category")
      return
    }

    if (!selectedWebsiteURL) {
      setError("Please select a website URL")
      return
    }

    const selectedURL = selectedUserDetails?.websiteURLs.find((url) => url._id === selectedWebsiteURL)
    if (!selectedURL) {
      setError("Selected website URL not found")
      return
    }

    setGenerating(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${API_BASE_URL}/qrcodes/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser,
          categoryId: selectedCategory,
          websiteURL: selectedURL.url,
          websiteTitle: selectedURL.title,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("QR code generated successfully")
        await fetchQRCodes()
        setSelectedUser("")
        setSelectedCategory("")
        setSelectedWebsiteURL("")
        setSelectedUserDetails(null)
      } else {
        setError(data.message || "Failed to generate QR code")
      }
    } catch (err) {
      console.error("Error generating QR code:", err)
      setError("Error generating QR code")
    } finally {
      setGenerating(false)
    }
  }

  const deleteQRCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this QR code? This action cannot be undone.")) return

    try {
      const response = await fetch(`${API_BASE_URL}/qrcodes/${codeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setSuccess("QR code deleted successfully")
        await fetchQRCodes()
      } else {
        const data = await response.json()
        setError(data.message || "Failed to delete QR code")
      }
    } catch (err) {
      console.error("Error deleting QR code:", err)
      setError("Error deleting QR code")
    }
  }

  const viewQRCode = (qrCode: QRCode) => {
    setCurrentQR(qrCode)
    setShowQRDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getCategoryStats = () => {
    const stats: { [key: string]: { name: string; color: string; count: number } } = {}

    qrCodes.forEach((qr) => {
      const categoryId = qr.category._id
      if (!stats[categoryId]) {
        stats[categoryId] = {
          name: qr.category.name,
          color: qr.category.color,
          count: 0,
        }
      }
      stats[categoryId].count++
    })

    return Object.values(stats).sort((a, b) => b.count - a.count)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>QR Code Generator</span>
          </CardTitle>
          <CardDescription>Generate QR codes for user websites and track their performance</CardDescription>
        </CardHeader>
        <CardContent>
          {(error || success) && (
            <Alert
              variant={error ? "destructive" : "default"}
              className={`mb-6 ${
                error ? "border-destructive bg-destructive/10" : "border-green-500 bg-green-50 dark:bg-green-950"
              }`}
            >
              <AlertDescription className={error ? "text-destructive" : "text-green-700 dark:text-green-400"}>
                {error || success}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              <Select value={selectedUser} onValueChange={handleUserSelection}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Select
                value={selectedWebsiteURL}
                onValueChange={setSelectedWebsiteURL}
                disabled={!selectedUser || loadingUserDetails}
              >
                <SelectTrigger id="website">
                  <SelectValue
                    placeholder={
                      !selectedUser
                        ? "Select user first"
                        : loadingUserDetails
                          ? "Loading..."
                          : selectedUserDetails?.websiteURLs?.length === 0
                            ? "No URLs available"
                            : "Select website URL"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedUserDetails?.websiteURLs?.map((websiteURL) => (
                    <SelectItem key={websiteURL._id} value={websiteURL._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{websiteURL.title}</span>
                        <span className="text-xs text-muted-foreground">{websiteURL.url}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUserDetails && selectedUserDetails.websiteURLs?.length === 0 && (
                <p className="text-xs text-muted-foreground">This user hasn't added any website URLs yet.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category" className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewCategoryInput(true)}
                  title="Add new category"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {showNewCategoryInput && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && createNewCategory()}
                  />
                  <Button size="sm" onClick={createNewCategory} disabled={creatingCategory || !newCategoryName.trim()}>
                    {creatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewCategoryInput(false)
                      setNewCategoryName("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateQRCode}
                disabled={generating || !selectedUser || !selectedCategory || !selectedWebsiteURL}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Selected Website Preview */}
          {selectedUserDetails && selectedWebsiteURL && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Selected Website Details:</h4>
              {(() => {
                const selectedURL = selectedUserDetails.websiteURLs.find((url) => url._id === selectedWebsiteURL)
                return selectedURL ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Title:</strong> {selectedURL.title}
                    </p>
                    <p className="flex items-center space-x-1">
                      <strong>URL:</strong>
                      <a
                        href={selectedURL.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                      >
                        <span>{selectedURL.url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    {selectedURL.description && (
                      <p>
                        <strong>Description:</strong> {selectedURL.description}
                      </p>
                    )}
                  </div>
                ) : null
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Generated QR Codes ({qrCodes.length})</span>
            </CardTitle>
            <CardDescription>Manage and monitor all generated QR codes</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
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
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Analytics */}
          {qrCodes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Category Distribution</h3>
              <div className="flex flex-wrap gap-2">
                {getCategoryStats().map((stat) => (
                  <Badge
                    key={stat.name}
                    variant="outline"
                    className="cursor-pointer"
                    style={{ borderColor: stat.color, color: stat.color }}
                    onClick={() => {
                      const category = categories.find((c) => c.name === stat.name)
                      setCategoryFilter(categoryFilter === category?._id ? "all" : category?._id || "all")
                    }}
                  >
                    {stat.name}: {stat.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading QR codes...</span>
            </div>
          ) : filteredQrCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {categoryFilter !== "all"
                ? "No QR codes found for the selected category."
                : "No QR codes have been generated yet."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
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
                            <p className="font-medium">{qrCode.websiteTitle}</p>
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
                        <td className="py-3 px-4">{formatDate(qrCode.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => viewQRCode(qrCode)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteQRCode(qrCode.codeId)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code View Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Details</DialogTitle>
            <DialogDescription>
              QR Code for {currentQR?.websiteTitle} - Assigned to {currentQR?.assignedTo.name}
            </DialogDescription>
          </DialogHeader>
          {currentQR && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={`${API_BASE_URL.replace("/api", "")}${currentQR.imageURL}`}
                  alt="QR Code"
                  className="w-64 h-64"
                  onError={(e) => {
                    console.error("Failed to load QR code image:", currentQR.imageURL)
                    e.currentTarget.src = "/placeholder.svg?height=256&width=256"
                  }}
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-medium">{currentQR.websiteTitle}</h3>
                <a
                  href={currentQR.websiteURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center justify-center space-x-1"
                >
                  <span>{currentQR.websiteURL}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Badge
                  variant="outline"
                  style={{ borderColor: currentQR.category.color, color: currentQR.category.color }}
                >
                  {currentQR.category.name}
                </Badge>
                <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                  <div>
                    <p className="font-medium">Total Scans</p>
                    <p className="text-lg font-bold text-green-600">{currentQR.scanCount}</p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{formatDate(currentQR.createdAt)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Code ID: {currentQR.codeId}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowQRDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Section */}
      <QRAnalytics />
    </div>
  )
}
