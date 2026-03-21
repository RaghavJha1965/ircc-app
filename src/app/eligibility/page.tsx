"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface ProgramResult {
  program: string
  category: "express-entry" | "category-based" | "pnp"
  eligible: boolean
  matchScore: number
  missingRequirements: string[]
  description: string
}

const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "SK", label: "Saskatchewan" },
  { value: "MB", label: "Manitoba" },
]

export default function EligibilityPage() {
  const [results, setResults] = useState<ProgramResult[]>([])
  const [nocCode, setNocCode] = useState("")
  const [nocTeerCategory, setNocTeerCategory] = useState("")
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchEligibility = async () => {
    try {
      const response = await fetch("/api/eligibility")
      const data = await response.json()
      if (data.results) setResults(data.results)
      if (data.totalScore) setTotalScore(data.totalScore)
      if (data.nocCode) setNocCode(data.nocCode)
      if (data.nocTeerCategory) setNocTeerCategory(data.nocTeerCategory)
      if (data.preferredProvinces) setSelectedProvinces(data.preferredProvinces)
    } catch (error) {
      console.error("Error fetching eligibility:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEligibility()
  }, [])

  const saveAndRefresh = async () => {
    setSaving(true)
    try {
      await fetch("/api/crs-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nocCode: nocCode || null,
          nocTeerCategory: nocTeerCategory || null,
          preferredProvinces: selectedProvinces.length > 0 ? selectedProvinces : null,
        }),
      })
      await fetchEligibility()
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSaving(false)
    }
  }

  const toggleProvince = (prov: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(prov) ? prev.filter((p) => p !== prov) : [...prev, prov]
    )
  }

  const expressEntry = results.filter((r) => r.category === "express-entry")
  const categoryBased = results.filter((r) => r.category === "category-based")
  const pnp = results.filter((r) => r.category === "pnp")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Program Eligibility</h1>
        <p className="text-muted-foreground mt-1">
          Check which immigration programs match your profile (CRS: {totalScore})
        </p>
      </div>

      {/* Profile Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Your Occupation & Preferences</CardTitle>
          <CardDescription>
            Enter your NOC code and preferred provinces to get personalized results.
            Your CRS profile data is used automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>NOC Code (5-digit)</Label>
              <Input
                placeholder="e.g. 21231"
                value={nocCode}
                onChange={(e) => setNocCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              />
              <p className="text-xs text-muted-foreground">
                Find your NOC at{" "}
                <a
                  href="https://noc.esdc.gc.ca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  noc.esdc.gc.ca
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label>TEER Category</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={nocTeerCategory}
                onChange={(e) => setNocTeerCategory(e.target.value)}
              >
                <option value="">Select TEER category</option>
                <option value="0">TEER 0 - Management</option>
                <option value="1">TEER 1 - Professional (university degree)</option>
                <option value="2">TEER 2 - Technical (college/apprenticeship)</option>
                <option value="3">TEER 3 - Intermediate (college/training)</option>
                <option value="4">TEER 4 - Entry level (high school/training)</option>
                <option value="5">TEER 5 - Labour (brief training)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Provinces for PNP</Label>
            <div className="flex flex-wrap gap-2">
              {PROVINCES.map((prov) => (
                <button
                  key={prov.value}
                  onClick={() => toggleProvince(prov.value)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedProvinces.includes(prov.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  }`}
                >
                  {prov.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={saveAndRefresh} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save & Check Eligibility
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="express-entry" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="express-entry">
            Express Entry ({expressEntry.length})
          </TabsTrigger>
          <TabsTrigger value="category-based">
            Category-Based ({categoryBased.length})
          </TabsTrigger>
          <TabsTrigger value="pnp">
            PNP Streams ({pnp.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="express-entry" className="space-y-4">
          {expressEntry.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Save your profile above to see Express Entry program matches.
              </CardContent>
            </Card>
          ) : (
            expressEntry.map((result) => (
              <ProgramCard key={result.program} result={result} />
            ))
          )}
        </TabsContent>

        <TabsContent value="category-based" className="space-y-4">
          {categoryBased.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Enter your NOC code above to check category-based draw eligibility.
              </CardContent>
            </Card>
          ) : (
            categoryBased.map((result) => (
              <ProgramCard key={result.program} result={result} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pnp" className="space-y-4">
          {pnp.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select preferred provinces above to see PNP stream matches.
              </CardContent>
            </Card>
          ) : (
            pnp.map((result) => (
              <ProgramCard key={result.program} result={result} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProgramCard({ result }: { result: ProgramResult }) {
  return (
    <Card className={result.eligible ? "border-green-500/30" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {result.eligible ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            ) : result.matchScore >= 50 ? (
              <AlertCircle className="h-6 w-6 text-yellow-500 shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400 shrink-0" />
            )}
            <div>
              <CardTitle className="text-lg">{result.program}</CardTitle>
              <CardDescription className="mt-1">{result.description}</CardDescription>
            </div>
          </div>
          <Badge
            variant={result.eligible ? "default" : "secondary"}
            className={result.eligible ? "bg-green-600" : ""}
          >
            {result.eligible ? "Eligible" : `${result.matchScore}% Match`}
          </Badge>
        </div>
      </CardHeader>
      {result.missingRequirements.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Missing Requirements:</p>
            <ul className="space-y-1">
              {result.missingRequirements.map((req, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
