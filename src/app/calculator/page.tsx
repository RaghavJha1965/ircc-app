"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calculator, Save, RefreshCw, TrendingUp, Zap, GraduationCap, Briefcase, Clock, Star } from "lucide-react"

interface LanguageScores {
  reading: number
  writing: number
  listening: number
  speaking: number
}

interface CrsBreakdown {
  coreHumanCapital: {
    age: number
    education: number
    firstLanguage: number
    secondLanguage: number
    canadianWork: number
  }
  spouseFactors: {
    education: number
    language: number
    canadianWork: number
  }
  skillTransferability: {
    educationLanguage: number
    educationCanadianWork: number
    foreignWorkLanguage: number
    foreignWorkCanadianWork: number
    certificateLanguage: number
  }
  additionalPoints: {
    provincialNomination: number
    jobOffer: number
    canadianEducation: number
    frenchAbility: number
    sibling: number
  }
  total: number
}

export default function CalculatorPage() {
  const [age, setAge] = useState(25)
  const [education, setEducation] = useState("bachelors-3plus")
  const [firstLanguage, setFirstLanguage] = useState<LanguageScores>({ reading: 7, writing: 7, listening: 7, speaking: 7 })
  const [hasSecondLanguage, setHasSecondLanguage] = useState(false)
  const [secondLanguage, setSecondLanguage] = useState<LanguageScores>({ reading: 0, writing: 0, listening: 0, speaking: 0 })
  const [canadianWork, setCanadianWork] = useState(0)
  const [foreignWork, setForeignWork] = useState(0)
  const [hasSpouse, setHasSpouse] = useState(false)
  const [spouseEducation, setSpouseEducation] = useState("none")
  const [spouseLanguage, setSpouseLanguage] = useState<LanguageScores>({ reading: 0, writing: 0, listening: 0, speaking: 0 })
  const [spouseCanadianWork, setSpouseCanadianWork] = useState(0)
  const [provincialNomination, setProvincialNomination] = useState(false)
  const [jobOffer, setJobOffer] = useState("")
  const [canadianEducation, setCanadianEducation] = useState("")
  const [frenchAbility, setFrenchAbility] = useState("")
  const [sibling, setSibling] = useState(false)

  interface Recommendation {
    category: string
    title: string
    description: string
    pointsGain: number
    priority: string
    difficulty: string
  }

  const [breakdown, setBreakdown] = useState<CrsBreakdown | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load saved profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/crs-profile")
        const data = await response.json()

        if (data.profile) {
          setAge(data.profile.age || 25)
          setEducation(data.profile.educationLevel || "bachelors-3plus")
          if (data.profile.firstLanguageScores) {
            setFirstLanguage(data.profile.firstLanguageScores)
          }
          if (data.profile.secondLanguageScores) {
            setHasSecondLanguage(true)
            setSecondLanguage(data.profile.secondLanguageScores)
          }
          setCanadianWork(data.profile.canadianWorkYears || 0)
          setForeignWork(data.profile.foreignWorkYears || 0)
          setHasSpouse(data.profile.hasSpouse || false)
          setSpouseEducation(data.profile.spouseEducation || "none")
          if (data.profile.spouseLanguageScores) {
            setSpouseLanguage(data.profile.spouseLanguageScores)
          }
          setSpouseCanadianWork(data.profile.spouseCanadianWork || 0)
          setProvincialNomination(data.profile.provincialNomination || false)
          setJobOffer(data.profile.jobOffer || "")
          setCanadianEducation(data.profile.canadianEducation || "")
          setFrenchAbility(data.profile.frenchAbility || "")
          setSibling(data.profile.sibling || false)
        }
        if (data.breakdown) {
          setBreakdown(data.breakdown)
        }
        if (data.recommendations) {
          setRecommendations(data.recommendations)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  // Calculate score whenever inputs change
  const calculateScore = async () => {
    try {
      const response = await fetch("/api/crs-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          educationLevel: education,
          firstLanguageScores: firstLanguage,
          secondLanguageScores: hasSecondLanguage ? secondLanguage : null,
          canadianWorkYears: canadianWork,
          foreignWorkYears: foreignWork,
          hasSpouse,
          spouseEducation: hasSpouse ? spouseEducation : null,
          spouseLanguageScores: hasSpouse ? spouseLanguage : null,
          spouseCanadianWork: hasSpouse ? spouseCanadianWork : 0,
          provincialNomination,
          jobOffer: jobOffer || null,
          canadianEducation: canadianEducation || null,
          frenchAbility: frenchAbility || null,
          sibling,
        }),
      })
      const data = await response.json()
      if (data.breakdown) {
        setBreakdown(data.breakdown)
      }
      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Error calculating score:", error)
    }
  }

  // Save profile
  const saveProfile = async () => {
    setSaving(true)
    await calculateScore()
    setSaving(false)
  }

  // Recalculate whenever inputs change
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(calculateScore, 300)
      return () => clearTimeout(timer)
    }
  }, [age, education, firstLanguage, hasSecondLanguage, secondLanguage, canadianWork, foreignWork, hasSpouse, spouseEducation, spouseLanguage, spouseCanadianWork, provincialNomination, jobOffer, canadianEducation, frenchAbility, sibling, loading])

  const educationOptions = [
    { value: "none", label: "Less than secondary school" },
    { value: "secondary", label: "Secondary diploma (high school)" },
    { value: "diploma-1", label: "One-year post-secondary" },
    { value: "diploma-2", label: "Two-year post-secondary" },
    { value: "bachelors-2", label: "Bachelor's degree (2 years)" },
    { value: "bachelors-3plus", label: "Bachelor's degree (3+ years)" },
    { value: "diploma-3plus", label: "Three-year post-secondary" },
    { value: "two-or-more", label: "Two or more credentials" },
    { value: "masters", label: "Master's degree" },
    { value: "phd", label: "Doctoral degree (PhD)" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalScore = breakdown?.total || 0

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRS Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate your Comprehensive Ranking System score
          </p>
        </div>
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Display */}
        <Card className="lg:col-span-1 h-fit sticky top-8">
          <CardHeader>
            <CardDescription>Your CRS Score</CardDescription>
            <CardTitle className="text-6xl text-primary">{totalScore}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(totalScore / 1200) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground">Maximum possible: 1200 points</p>

            {breakdown && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Core Human Capital</span>
                  <span className="font-semibold">
                    {breakdown.coreHumanCapital.age +
                      breakdown.coreHumanCapital.education +
                      breakdown.coreHumanCapital.firstLanguage +
                      breakdown.coreHumanCapital.secondLanguage +
                      breakdown.coreHumanCapital.canadianWork}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Spouse Factors</span>
                  <span className="font-semibold">
                    {breakdown.spouseFactors.education +
                      breakdown.spouseFactors.language +
                      breakdown.spouseFactors.canadianWork}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Skill Transferability</span>
                  <span className="font-semibold">
                    {breakdown.skillTransferability.educationLanguage +
                      breakdown.skillTransferability.educationCanadianWork +
                      breakdown.skillTransferability.foreignWorkLanguage +
                      breakdown.skillTransferability.foreignWorkCanadianWork}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Additional Points</span>
                  <span className="font-semibold">
                    {breakdown.additionalPoints.provincialNomination +
                      breakdown.additionalPoints.jobOffer +
                      breakdown.additionalPoints.canadianEducation +
                      breakdown.additionalPoints.frenchAbility +
                      breakdown.additionalPoints.sibling}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="language">Language</TabsTrigger>
              <TabsTrigger value="spouse">Spouse</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        min={18}
                        max={100}
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                      />
                      <p className="text-xs text-muted-foreground">Your age on the date you submit your profile</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Education Level</Label>
                      <Select value={education} onValueChange={setEducation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {educationOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Canadian Work Experience (years)</Label>
                      <Select value={canadianWork.toString()} onValueChange={(v) => setCanadianWork(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5].map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                              {y === 0 ? "None" : y === 5 ? "5 or more years" : `${y} year${y > 1 ? "s" : ""}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Foreign Work Experience (years)</Label>
                      <Select value={foreignWork.toString()} onValueChange={(v) => setForeignWork(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3].map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                              {y === 0 ? "None" : y === 3 ? "3 or more years" : `${y} year${y > 1 ? "s" : ""}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Switch checked={hasSpouse} onCheckedChange={setHasSpouse} />
                    <Label>Do you have a spouse or common-law partner?</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="language" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>First Official Language (English)</CardTitle>
                  <CardDescription>Enter your IELTS band scores (0-9)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {(["reading", "writing", "listening", "speaking"] as const).map((skill) => (
                      <div key={skill} className="space-y-2">
                        <Label className="capitalize">{skill}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={9}
                          step={0.5}
                          value={firstLanguage[skill]}
                          onChange={(e) =>
                            setFirstLanguage({ ...firstLanguage, [skill]: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Second Official Language (French)</CardTitle>
                      <CardDescription>Optional - Enter your TEF/TCF scores</CardDescription>
                    </div>
                    <Switch checked={hasSecondLanguage} onCheckedChange={setHasSecondLanguage} />
                  </div>
                </CardHeader>
                {hasSecondLanguage && (
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {(["reading", "writing", "listening", "speaking"] as const).map((skill) => (
                        <div key={skill} className="space-y-2">
                          <Label className="capitalize">{skill} (CLB)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={12}
                            value={secondLanguage[skill]}
                            onChange={(e) =>
                              setSecondLanguage({ ...secondLanguage, [skill]: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="spouse" className="space-y-6">
              {hasSpouse ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Spouse Education & Work</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Spouse Education Level</Label>
                        <Select value={spouseEducation} onValueChange={setSpouseEducation}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {educationOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Spouse Canadian Work Experience</Label>
                        <Select value={spouseCanadianWork.toString()} onValueChange={(v) => setSpouseCanadianWork(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5].map((y) => (
                              <SelectItem key={y} value={y.toString()}>
                                {y === 0 ? "None" : `${y} year${y > 1 ? "s" : ""}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Spouse Language Scores</CardTitle>
                      <CardDescription>Enter spouse IELTS band scores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        {(["reading", "writing", "listening", "speaking"] as const).map((skill) => (
                          <div key={skill} className="space-y-2">
                            <Label className="capitalize">{skill}</Label>
                            <Input
                              type="number"
                              min={0}
                              max={9}
                              step={0.5}
                              value={spouseLanguage[skill]}
                              onChange={(e) =>
                                setSpouseLanguage({ ...spouseLanguage, [skill]: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p>You indicated you don&apos;t have a spouse.</p>
                    <p className="text-sm mt-2">Go to the Personal tab to change this.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="additional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Points</CardTitle>
                  <CardDescription>These can significantly boost your score</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Provincial Nomination</p>
                      <p className="text-sm text-muted-foreground">+600 points</p>
                    </div>
                    <Switch checked={provincialNomination} onCheckedChange={setProvincialNomination} />
                  </div>

                  <div className="space-y-2">
                    <Label>Valid Job Offer</Label>
                    <Select value={jobOffer} onValueChange={setJobOffer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job offer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No job offer</SelectItem>
                        <SelectItem value="00">NOC 00 (Senior manager) - 200 pts</SelectItem>
                        <SelectItem value="0ab">NOC 0, A, B - 50 pts</SelectItem>
                        <SelectItem value="other">Other NOC - 50 pts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Canadian Education</Label>
                    <Select value={canadianEducation} onValueChange={setCanadianEducation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Canadian education" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="1-2years">1-2 year credential - 15 pts</SelectItem>
                        <SelectItem value="3+years">3+ year credential - 30 pts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>French Language Ability</Label>
                    <Select value={frenchAbility} onValueChange={setFrenchAbility}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select French ability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No French or below CLB 7</SelectItem>
                        <SelectItem value="clb7+">CLB 7+ (all abilities) - 25 pts</SelectItem>
                        <SelectItem value="clb7+withEnglish5+">CLB 7+ French + CLB 5+ English - 50 pts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Sibling in Canada</p>
                      <p className="text-sm text-muted-foreground">Citizen or PR - +15 points</p>
                    </div>
                    <Switch checked={sibling} onCheckedChange={setSibling} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Score Improvement Tips
            </CardTitle>
            <CardDescription>
              Actionable ways to increase your CRS score, sorted by potential points gained
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, i) => {
                const categoryIcons: Record<string, React.ReactNode> = {
                  language: <Zap className="h-4 w-4" />,
                  education: <GraduationCap className="h-4 w-4" />,
                  work: <Briefcase className="h-4 w-4" />,
                  additional: <Star className="h-4 w-4" />,
                  age: <Clock className="h-4 w-4" />,
                }

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      rec.priority === "high"
                        ? "border-primary/30 bg-primary/5"
                        : rec.priority === "medium"
                        ? "border-yellow-500/20 bg-yellow-500/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted-foreground">
                          {categoryIcons[rec.category] || <Star className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{rec.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {rec.category}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                rec.difficulty === "easy"
                                  ? "bg-green-500/10 text-green-600"
                                  : rec.difficulty === "moderate"
                                  ? "bg-yellow-500/10 text-yellow-600"
                                  : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {rec.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-bold text-primary">+{rec.pointsGain}</span>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
