"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Loader2, Plus, MoreHorizontal, Edit, Trash2, Tag } from "lucide-react"

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
}

interface CategoryAnalytics {
  _id: string
  name: string
  color: string
  count: number
}

const colorOptions = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
]

export default function CategoryManagement() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [analytics, setAnalytics] = useState<CategoryAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  })

  useEffect(() => {
    fetchCategories()
    fetchAnalytics()
  }, [])

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
      const response = await fetch(`${API_BASE_URL}/categories/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (err) {
      console.error("Error fetching analytics:", err)
    }
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
        fetchCategories()
        fetchAnalytics()
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
        fetchCategories()
        fetchAnalytics()
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Category Management</span>
            </CardTitle>
            <CardDescription>Manage QR code categories and view analytics</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
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

          {/* Analytics Section */}
          {analytics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Category Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {analytics.map((item) => (
                  <div key={item._id} className="text-center">
                    <Badge
                      variant="outline"
                      className="w-full justify-center py-2"
                      style={{ borderColor: item.color, color: item.color }}
                    >
                      {item.name}: {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
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
                          <DropdownMenuItem onClick={() => deleteCategory(category._id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Created by {category.createdBy.name} on {formatDate(category.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
