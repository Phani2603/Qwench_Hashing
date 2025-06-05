"use client"

import RouteGuard from "@/components/auth/route-guard"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useAuth } from "@/contexts/auth-context"
import { Settings, Bell, Shield, Download, Trash2 } from "lucide-react"
import Link from "next/link"

function SettingsContent() {
  const { user } = useAuth()

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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and security settings.</p>
          </div>

          <div className="space-y-6">
            {/* Account Settings */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Account Settings</span>
                </CardTitle>
                <CardDescription>Manage your account information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Profile Information</Label>
                    <div className="text-sm text-muted-foreground">
                      Update your name, email, and other personal information
                    </div>
                  </div>
                  <Link href="/profile">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Account Type</Label>
                    <div className="text-sm text-muted-foreground">
                      Current role: <span className="capitalize font-medium">{user?.role}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user?.role === "admin" ? "Administrator" : "Standard User"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-base">
                      Email Notifications
                    </Label>
                    <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="security-alerts" className="text-base">
                      Security Alerts
                    </Label>
                    <div className="text-sm text-muted-foreground">Get notified about security-related activities</div>
                  </div>
                  <Switch id="security-alerts" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-updates" className="text-base">
                      System Updates
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications about system updates and maintenance
                    </div>
                  </div>
                  <Switch id="system-updates" />
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Privacy & Security</span>
                </CardTitle>
                <CardDescription>Manage your privacy and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Password</Label>
                    <div className="text-sm text-muted-foreground">Change your account password</div>
                  </div>
                  <Link href="/profile">
                    <Button variant="outline">Change Password</Button>
                  </Link>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="profile-visibility" className="text-base">
                      Profile Visibility
                    </Label>
                    <div className="text-sm text-muted-foreground">Control who can see your profile information</div>
                  </div>
                  <Switch id="profile-visibility" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="activity-tracking" className="text-base">
                      Activity Tracking
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Allow the system to track your activity for analytics
                    </div>
                  </div>
                  <Switch id="activity-tracking" />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Data Management</span>
                </CardTitle>
                <CardDescription>Manage your data and account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Export Data</Label>
                    <div className="text-sm text-muted-foreground">Download a copy of your account data</div>
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-destructive">Delete Account</Label>
                    <div className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </div>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function SettingsPage() {
  return (
    <RouteGuard requireAuth={true}>
      <SettingsContent />
    </RouteGuard>
  )
}
