"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
  fallbackComponent?: React.ReactNode
}

export default function RouteGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  redirectTo,
  fallbackComponent,
}: RouteGuardProps) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  const [showUnauthorized, setShowUnauthorized] = useState(false)

  useEffect(() => {
    if (loading) return

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo || "/login")
      return
    }

    if (requireAdmin && !isAdmin) {
      if (isAuthenticated) {
        setShowUnauthorized(true)
      } else {
        router.push(redirectTo || "/login")
      }
      return
    }

    setShowUnauthorized(false)
  }, [user, loading, isAuthenticated, isAdmin, requireAuth, requireAdmin, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (showUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access this page. Admin privileges are required.
            </AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return fallbackComponent || null
  }

  if (requireAdmin && !isAdmin) {
    return fallbackComponent || null
  }

  return <>{children}</>
}
