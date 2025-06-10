"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText, Mail, Loader2 } from "lucide-react"

interface DataExportCardProps {
  token?: string | null
}

const DataExportCard: React.FC<DataExportCardProps> = ({ token }) => {
  const [exportLoading, setExportLoading] = useState({
    csv: false,
    pdf: false,
    email: false
  })
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  
  const handleExport = async (format: string) => {
    if (!token) {
      alert("Authentication required for export")
      return
    }
    
    setExportLoading(prev => ({ ...prev, [format]: true }))
    
    try {
      if (format === 'email') {
        // Send email export request
        const response = await fetch(`${API_BASE_URL}/analytics/export/email`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ format: 'pdf' })
        })
        
        if (response.ok) {
          alert("Report scheduled to be sent to your email")
        } else {
          alert("Failed to schedule email report")
        }
      } else {
        // For CSV and PDF, create download
        const response = await fetch(`${API_BASE_URL}/analytics/export/${format}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (response.ok) {
          // Create blob and download
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `qr_analytics_${new Date().toISOString().split('T')[0]}.${format}`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          alert(`Failed to export as ${format.toUpperCase()}`)
        }
      }
    } catch (err) {
      console.error(`Error exporting ${format}:`, err)
      alert(`Failed to export as ${format.toUpperCase()}`)
    } finally {
      setTimeout(() => {
        setExportLoading(prev => ({ ...prev, [format]: false }))
      }, 1500)
    }
  }
    
  return (
    <Card className="col-span-full md:col-span-4 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Data Export</span>
        </CardTitle>
        <CardDescription>Export your QR code analytics data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={exportLoading.csv}
                >
                  {exportLoading.csv ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  CSV
                </Button>
              </div>
              <h3 className="font-medium">CSV Export</h3>
              <p className="text-sm text-muted-foreground">Download scan data in CSV format</p>
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <FileText className="h-8 w-8 text-primary" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={exportLoading.pdf}
                >
                  {exportLoading.pdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
              </div>
              <h3 className="font-medium">PDF Report</h3>
              <p className="text-sm text-muted-foreground">Download a formatted PDF report</p>
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <Mail className="h-8 w-8 text-primary" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('email')}
                  disabled={exportLoading.email}
                >
                  {exportLoading.email ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Email
                </Button>
              </div>
              <h3 className="font-medium">Email Report</h3>
              <p className="text-sm text-muted-foreground">Schedule recurring email reports</p>
            </div>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Export your QR code analytics data including device breakdown, scan trends, and detailed statistics.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DataExportCard
