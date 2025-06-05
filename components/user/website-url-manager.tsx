"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Globe, Plus, Edit, Trash2, Loader2, ExternalLink } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface WebsiteURL {
  _id: string
  url: string
  title: string
  description: string
  isActive: boolean
  createdAt: string
}

export default function WebsiteURLManager() {
  const { token } = useAuth()
  const [websiteURLs, setWebsiteURLs] = useState<WebsiteURL[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingURL, setEditingURL] = useState<WebsiteURL | null>(null)

  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: "",
  })

  useEffect(() => {
    fetchWebsiteURLs()
  }, [])

  const fetchWebsiteURLs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/website-urls`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWebsiteURLs(data.websiteURLs || [])
      } else {
        setError("Failed to fetch website URLs")
      }
    } catch (err) {
      console.error("Error fetching website URLs:", err)
      setError("Error fetching website URLs")
    } finally {
      setLoading(false)
    }
  }

  const validateURL = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateURL(formData.url)) {
      setError("Please enter a valid URL (including http:// or https://)")
      return
    }

    if (!formData.title.trim()) {
      setError("Please enter a title for your website")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const url = editingURL
        ? `${API_BASE_URL}/user/website-urls/${editingURL._id}`
        : `${API_BASE_URL}/user/website-urls`

      const method = editingURL ? "PUT" : "POST"

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
        setSuccess(editingURL ? "Website URL updated successfully!" : "Website URL added successfully!")
        setWebsiteURLs(data.websiteURLs)
        setFormData({ url: "", title: "", description: "" })
        setShowAddDialog(false)
        setEditingURL(null)
      } else {
        setError(data.message || "Failed to save website URL")
      }
    } catch (err) {
      console.error("Error saving website URL:", err)
      setError("Error saving website URL")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (websiteURL: WebsiteURL) => {
    setEditingURL(websiteURL)
    setFormData({
      url: websiteURL.url,
      title: websiteURL.title,
      description: websiteURL.description,
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (urlId: string) => {
    if (!confirm("Are you sure you want to delete this website URL?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/user/website-urls/${urlId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Website URL deleted successfully!")
        setWebsiteURLs(data.websiteURLs)
      } else {
        setError(data.message || "Failed to delete website URL")
      }
    } catch (err) {
      console.error("Error deleting website URL:", err)
      setError("Error deleting website URL")
    }
  }

  const resetForm = () => {
    setFormData({ url: "", title: "", description: "" })
    setEditingURL(null)
    setShowAddDialog(false)
    setError("")
  }

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading website URLs...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>My Website URLs ({websiteURLs.length}/2)</span>
            </CardTitle>
            <CardDescription>
              Add up to 2 website URLs that admins can use to generate QR codes for your business
            </CardDescription>
          </div>
          {websiteURLs.length < 2 && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Website URL
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingURL ? "Edit Website URL" : "Add Website URL"}</DialogTitle>
                  <DialogDescription>
                    {editingURL ? "Update your website information" : "Add a website URL for QR code generation"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Website Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="My Business Website"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your website"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      maxLength={200}
                      rows={3}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {editingURL ? "Updating..." : "Adding..."}
                        </>
                      ) : editingURL ? (
                        "Update URL"
                      ) : (
                        "Add URL"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
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

          {websiteURLs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No website URLs added yet</p>
              <p className="text-sm">Add your website URLs so admins can generate QR codes for your business</p>
            </div>
          ) : (
            <div className="space-y-4">
              {websiteURLs.map((websiteURL) => (
                <div key={websiteURL._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{websiteURL.title}</h3>
                        <Badge variant={websiteURL.isActive ? "default" : "secondary"}>
                          {websiteURL.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <ExternalLink className="h-4 w-4" />
                        <a
                          href={websiteURL.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline"
                        >
                          {websiteURL.url}
                        </a>
                      </div>
                      {websiteURL.description && (
                        <p className="text-sm text-muted-foreground">{websiteURL.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Added: {new Date(websiteURL.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(websiteURL)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(websiteURL._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {websiteURLs.length >= 2 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Maximum reached:</strong> You have added the maximum number of website URLs (2). Delete an
                existing URL to add a new one.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
