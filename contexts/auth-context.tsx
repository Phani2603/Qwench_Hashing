"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface User {
  id: string
  _id: string // Add MongoDB _id field
  name: string
  email: string
  role: "user" | "admin"
  lastLogin?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  initialAdminSignup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isUser: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null

      if (storedToken && storedUser) {
        setToken(storedToken)

        // Try to parse stored user first
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (e) {
          console.error("Error parsing stored user:", e)
        }

        // Verify token is still valid and refresh user data
        await fetchCurrentUser(storedToken)
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
      clearAuth()
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Ensure both id and _id are available for compatibility
        const userData = {
          ...data.user,
          _id: data.user.id || data.user._id,
          id: data.user.id || data.user._id,
        }
        setUser(userData)

        // Update stored user data
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userData))
        }
      } else {
        // Token is invalid, clear auth
        clearAuth()
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
      clearAuth()
    }
  }

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token)
    }
  }

  const clearAuth = () => {
    setUser(null)
    setToken(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      const userData = {
        ...data.user,
        _id: data.user.id || data.user._id,
        id: data.user.id || data.user._id,
      }

      setToken(data.token)
      setUser(userData)

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(userData))
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Provide more specific error messages
        let errorMessage = data.message || "Signup failed"
        if (data.details) {
          errorMessage = data.details
        }
        throw new Error(errorMessage)
      }

      const userData = {
        ...data.user,
        _id: data.user.id || data.user._id,
        id: data.user.id || data.user._id,
      }

      setToken(data.token)
      setUser(userData)

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(userData))
      }
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const initialAdminSignup = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/initial-admin-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Initial admin signup failed")
    }

    const userData = {
      ...data.user,
      _id: data.user.id || data.user._id,
      id: data.user.id || data.user._id,
    }

    setToken(data.token)
    setUser(userData)

    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(userData))
    }
  }

  const logout = () => {
    clearAuth()
  }

  const value = {
    user,
    token,
    login,
    signup,
    initialAdminSignup,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user" || user?.role === "admin",
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
