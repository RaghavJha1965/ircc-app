"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, GraduationCap, Languages, Briefcase, ShieldCheck, Wallet, AlertTriangle, CheckCircle2, Clock, Save } from "lucide-react"

interface Document {
  id: string
  name: string
  category: string
  description: string | null
  isCompleted: boolean
  dueDate: string | null
  notes: string | null
}

interface DocumentsResponse {
  documents: Document[]
  grouped: Record<string, Document[]>
  stats: {
    total: number
    completed: number
    percentage: number
  }
}

const categoryConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  identity: { icon: ShieldCheck, label: "Identity", color: "bg-blue-500" },
  education: { icon: GraduationCap, label: "Education", color: "bg-purple-500" },
  language: { icon: Languages, label: "Language", color: "bg-green-500" },
  work: { icon: Briefcase, label: "Work Experience", color: "bg-orange-500" },
  "police-medical": { icon: ShieldCheck, label: "Police & Medical", color: "bg-red-500" },
  financial: { icon: Wallet, label: "Financial", color: "bg-yellow-500" },
}

interface ExpiryWarning {
  document: string
  issueDate: string
  expiryDate: string
  daysRemaining: number
  status: "valid" | "expiring-soon" | "expired"
  validityPeriod: string
}

interface ImportantDates {
  ieltsTestDate: string | null
  medicalExamDate: string | null
  policeClearanceDate: string | null
  ecaIssueDate: string | null
  irccProfileCreatedDate: string | null
}

export default function ChecklistPage() {
  const [data, setData] = useState<DocumentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [warnings, setWarnings] = useState<ExpiryWarning[]>([])
  const [dates, setDates] = useState<ImportantDates>({
    ieltsTestDate: null,
    medicalExamDate: null,
    policeClearanceDate: null,
    ecaIssueDate: null,
    irccProfileCreatedDate: null,
  })
  const [savingDates, setSavingDates] = useState(false)

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeline = async () => {
    try {
      const response = await fetch("/api/timeline")
      const json = await response.json()
      if (json.warnings) setWarnings(json.warnings)
      if (json.dates) {
        setDates({
          ieltsTestDate: json.dates.ieltsTestDate ? json.dates.ieltsTestDate.split("T")[0] : null,
          medicalExamDate: json.dates.medicalExamDate ? json.dates.medicalExamDate.split("T")[0] : null,
          policeClearanceDate: json.dates.policeClearanceDate ? json.dates.policeClearanceDate.split("T")[0] : null,
          ecaIssueDate: json.dates.ecaIssueDate ? json.dates.ecaIssueDate.split("T")[0] : null,
          irccProfileCreatedDate: json.dates.irccProfileCreatedDate ? json.dates.irccProfileCreatedDate.split("T")[0] : null,
        })
      }
    } catch (error) {
      console.error("Error fetching timeline:", error)
    }
  }

  const saveDates = async () => {
    setSavingDates(true)
    try {
      await fetch("/api/crs-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ieltsTestDate: dates.ieltsTestDate || null,
          medicalExamDate: dates.medicalExamDate || null,
          policeClearanceDate: dates.policeClearanceDate || null,
          ecaIssueDate: dates.ecaIssueDate || null,
          irccProfileCreatedDate: dates.irccProfileCreatedDate || null,
        }),
      })
      await fetchTimeline()
    } catch (error) {
      console.error("Error saving dates:", error)
    } finally {
      setSavingDates(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
    fetchTimeline()
  }, [])

  const toggleDocument = async (doc: Document) => {
    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doc.id,
          isCompleted: !doc.isCompleted,
        }),
      })
      // Refresh the list
      fetchDocuments()
    } catch (error) {
      console.error("Error updating document:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = data?.stats || { total: 0, completed: 0, percentage: 0 }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Document Checklist</h1>
        <p className="text-muted-foreground mt-1">
          Track your PR application documents
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                {stats.completed} of {stats.total} documents completed
              </CardDescription>
            </div>
            <div className="text-4xl font-bold text-primary">{stats.percentage}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={stats.percentage} className="h-4" />
        </CardContent>
      </Card>

      {/* Document Expiry Warnings */}
      {warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Document Expiry Tracker
            </CardTitle>
            <CardDescription>
              Track validity of your important documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.map((warning) => (
                <div
                  key={warning.document}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    warning.status === "expired"
                      ? "border-red-500/30 bg-red-500/5"
                      : warning.status === "expiring-soon"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-green-500/30 bg-green-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {warning.status === "expired" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    ) : warning.status === "expiring-soon" ? (
                      <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{warning.document}</p>
                      <p className="text-xs text-muted-foreground">
                        Valid for {warning.validityPeriod} &middot; Expires{" "}
                        {new Date(warning.expiryDate).toLocaleDateString("en-CA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={warning.status === "valid" ? "default" : "secondary"}
                    className={
                      warning.status === "expired"
                        ? "bg-red-600 text-white"
                        : warning.status === "expiring-soon"
                        ? "bg-yellow-500 text-white"
                        : "bg-green-600 text-white"
                    }
                  >
                    {warning.status === "expired"
                      ? "Expired"
                      : warning.status === "expiring-soon"
                      ? `${warning.daysRemaining}d left`
                      : `${warning.daysRemaining}d left`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Dates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Important Dates</CardTitle>
              <CardDescription>
                Enter dates to track document validity and expiry warnings
              </CardDescription>
            </div>
            <Button size="sm" onClick={saveDates} disabled={savingDates}>
              <Save className="h-4 w-4 mr-2" />
              {savingDates ? "Saving..." : "Save Dates"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>IELTS Test Date</Label>
              <Input
                type="date"
                value={dates.ieltsTestDate || ""}
                onChange={(e) => setDates({ ...dates, ieltsTestDate: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Medical Exam Date</Label>
              <Input
                type="date"
                value={dates.medicalExamDate || ""}
                onChange={(e) => setDates({ ...dates, medicalExamDate: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Police Clearance Date</Label>
              <Input
                type="date"
                value={dates.policeClearanceDate || ""}
                onChange={(e) => setDates({ ...dates, policeClearanceDate: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>ECA Issue Date</Label>
              <Input
                type="date"
                value={dates.ecaIssueDate || ""}
                onChange={(e) => setDates({ ...dates, ecaIssueDate: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label>IRCC Profile Created</Label>
              <Input
                type="date"
                value={dates.irccProfileCreatedDate || ""}
                onChange={(e) => setDates({ ...dates, irccProfileCreatedDate: e.target.value || null })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards */}
      <div className="space-y-6">
        {Object.entries(data?.grouped || {}).map(([category, docs]) => {
          const config = categoryConfig[category] || {
            icon: FileText,
            label: category,
            color: "bg-gray-500",
          }
          const Icon = config.icon
          const completedInCategory = docs.filter((d) => d.isCompleted).length

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                      <CardDescription>
                        {completedInCategory} of {docs.length} completed
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={completedInCategory === docs.length ? "default" : "secondary"}>
                    {completedInCategory === docs.length ? "Complete" : "In Progress"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-start gap-4 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                        doc.isCompleted ? "bg-muted/30" : ""
                      }`}
                      onClick={() => toggleDocument(doc)}
                    >
                      <Checkbox
                        checked={doc.isCompleted}
                        onCheckedChange={() => toggleDocument(doc)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${doc.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {doc.name}
                        </p>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tips Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Tips for Document Preparation</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep all original documents safe and make certified copies</li>
            <li>• Police clearances should be obtained from every country where you lived 6+ months</li>
            <li>• ECA must be from a designated organization (WES, IQAS, etc.)</li>
            <li>• Language test results are valid for 2 years from the test date</li>
            <li>• Medical exams are valid for 12 months</li>
            <li>• Bank statements should show consistent funds over several months</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
