"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Lock, Shield } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function InitialAdminSetup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  const { initialAdminSignup } = useAuth()
  const router = useRouter()

  useEffect(() => {
    checkInitialSetup()
  }, [])

  const checkInitialSetup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-initial-setup`)
      const data = await response.json()

      if (data.success) {
        setNeedsSetup(data.needsInitialSetup)
        if (!data.needsInitialSetup) {
          router.push("/login")
        }
      }
    } catch (err) {
      setError("Failed to check setup status")
    } finally {
      setCheckingSetup(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)

    try {
      await initialAdminSignup(name, email, password)
      router.push("/admin/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Initial admin setup failed")
    } finally {
      setLoading(false)
    }
  }

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Checking setup status...</p>
        </div>
      </div>
    )
  }

  if (!needsSetup) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Initial Admin Setup
          </CardTitle>
          <CardDescription className="text-slate-600">
            Create the first administrator account for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              This is a one-time setup. After creating the admin account, this page will no longer be accessible.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Administrator Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter admin full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Administrator Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating admin account...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Admin Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
