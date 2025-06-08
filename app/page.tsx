"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Lock, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdmin) {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, loading, isAdmin, router])

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

  if (isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">RBAC System</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            A comprehensive Role-Based Access Control system with secure authentication, user management, and granular
            permissions.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Secure Authentication</CardTitle>
              <CardDescription>JWT-based authentication with bcrypt password hashing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Secure password encryption</li>
                <li>• JWT token management</li>
                <li>• Session persistence</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Granular role-based access control system</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Admin and User roles</li>
                <li>• Protected routes</li>
                <li>• Permission-based UI</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Admin Controls</CardTitle>
              <CardDescription>Comprehensive administrative dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• User management</li>
                <li>• System monitoring</li>
                <li>• One-time admin setup</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Choose your path to access the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/login" className="block">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </Link>
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500 mb-2">Need to set up the initial admin account?</p>
                <Link href="/initial-admin-setup" className="block">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                    ...
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
