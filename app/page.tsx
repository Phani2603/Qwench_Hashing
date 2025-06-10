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
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-float-slow"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-float-medium"></div>
          <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-white/10 rounded-full animate-float-delayed"></div>
        </div>
        <div className="text-center z-10 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-full blur-3xl animate-float-delayed"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-float-medium"></div>
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-white/10 rounded-full animate-float-delayed"></div>
        <div className="absolute top-10 right-1/3 w-1.5 h-1.5 bg-white/25 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-20 left-1/3 w-2.5 h-2.5 bg-white/15 rounded-full animate-float-medium"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center animate-glow-pulse">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent animate-shimmer">
            RBAC System
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto break-words overflow-wrap-anywhere">
            A comprehensive Role-Based Access Control system with secure authentication, user management, and granular
            permissions.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-scale-in">
          <Card className="shadow-2xl bg-black/40 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-black/60 hover:scale-105">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Secure Authentication</CardTitle>
              <CardDescription className="text-gray-400">JWT-based authentication with bcrypt password hashing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Secure password encryption</li>
                <li>• JWT token management</li>
                <li>• Session persistence</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-2xl bg-black/40 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-black/60 hover:scale-105">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <CardTitle className="text-white">Role Management</CardTitle>
              <CardDescription className="text-gray-400">Granular role-based access control system</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Admin and User roles</li>
                <li>• Protected routes</li>
                <li>• Permission-based UI</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-2xl bg-black/40 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-black/60 hover:scale-105">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">Admin Controls</CardTitle>
              <CardDescription className="text-gray-400">Comprehensive administrative dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• User management</li>
                <li>• System monitoring</li>
                <li>• One-time admin setup</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center animate-fade-in">
          <Card className="shadow-2xl bg-black/60 backdrop-blur-sm border border-white/20 max-w-md mx-auto transition-all duration-300 hover:bg-black/80">
            <CardHeader>
              <CardTitle className="text-white">Get Started</CardTitle>
              <CardDescription className="text-gray-400">Choose your path to access the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/login" className="block">
                <Button className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/20 hover:to-white/30 text-white border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105">
                  Create Account
                </Button>
              </Link>
              <div className="pt-4 border-t border-white/20">
                <p className="text-xs text-gray-400 mb-2">Need to set up the initial admin account?</p>
                <Link href="/initial-admin-setup" className="block">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300">
                    Initial Admin Setup
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
