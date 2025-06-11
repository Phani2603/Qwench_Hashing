"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Users, Search, MoreHorizontal, UserCheck, Shield, Trash2, Loader2, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface User {
  _id: string
  name: string
  email: string
  role: "user" | "admin"
  createdAt: string
  updatedAt: string
}

export default function UserManagement() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10) // Show 10 users per page
  
  // Calculate pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )
    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when search changes
  }, [users, searchTerm])

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
        fetchUsers() // Refresh the list
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
        fetchUsers() // Refresh the list
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
    // Can't modify yourself or if you're not an admin
    return currentUser?.id !== user._id && currentUser?.role === "admin"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading users...</span>
      </div>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>User Management</span>
        </CardTitle>
        <CardDescription>Manage user accounts and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {(message || error) && (
          <Alert
            variant={error ? "destructive" : "default"}
            className={`mb-6 ${error ? "border-destructive bg-destructive/10" : "border-green-500 bg-green-50 dark:bg-green-950"}`}
          >
            <AlertDescription className={error ? "text-destructive" : "text-green-700 dark:text-green-400"}>
              {message || error}
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No users found matching your search." : "No users found."}
            </div>
          ) : (
            <>
              {/* User Count and Pagination Info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <p>
                  Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </p>
                {totalPages > 1 && (
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

              {/* Users Display */}
              {currentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-foreground">{getInitials(user.name)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                        {user.updatedAt !== user.createdAt && (
                          <span> • Updated {new Date(user.updatedAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Administrator" : "User"}
                    </Badge>

                    {currentUser?.id === user._id && (
                      <Badge
                        variant="outline"
                        className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      >
                        You
                      </Badge>
                    )}

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
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
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
      </CardContent>
    </Card>
  )
}
