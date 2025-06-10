"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DeviceAnalytics from "./device-analytics"
import ScanActivityAnalytics from "./scan-activity-analytics"
import DataExportCard from "./data-export-card"
import { ChartBar } from "lucide-react"

interface QRCodeAnalyticsProps {
  token?: string | null
}

const QRCodeAnalytics: React.FC<QRCodeAnalyticsProps> = ({ token }) => {
  return (
    <>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChartBar className="h-5 w-5" />
            <span>QR Code Analytics</span>
          </CardTitle>
          <CardDescription>Detailed analytics and reporting for your QR codes</CardDescription>
        </CardHeader>
      </Card>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 pt-2">
        <DeviceAnalytics token={token} />
      </div>
      
      <ScanActivityAnalytics token={token} />
      
      <DataExportCard token={token} />
    </>
  )
}

export default QRCodeAnalytics
