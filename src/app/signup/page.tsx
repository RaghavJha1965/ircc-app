"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2 } from "lucide-react"

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

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Step 1: Account
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Step 2: Profile basics
  const [age, setAge] = useState(25)
  const [education, setEducation] = useState("bachelors-3plus")
  const [canadianWork, setCanadianWork] = useState(0)
  const [foreignWork, setForeignWork] = useState(0)
  const [hasSpouse, setHasSpouse] = useState(false)

  // Step 3: Language
  const [reading, setReading] = useState(7)
  const [writing, setWriting] = useState(7)
  const [listening, setListening] = useState(7)
  const [speaking, setSpeaking] = useState(7)

  // Step 4: NOC + Preferences
  const [nocCode, setNocCode] = useState("")
  const [nocTeer, setNocTeer] = useState("")

  const handleSignup = async () => {
    setError("")
    setLoading(true)

    try {
      // 1. Create account
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const signupData = await signupRes.json()

      if (!signupRes.ok) {
        setError(signupData.error || "Signup failed")
        setLoading(false)
        return
      }

      // 2. Save profile data
      await fetch("/api/crs-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          educationLevel: education,
          firstLanguageScores: { reading, writing, listening, speaking },
          canadianWorkYears: canadianWork,
          foreignWorkYears: foreignWork,
          hasSpouse,
          nocCode: nocCode || null,
          nocTeerCategory: nocTeer || null,
        }),
      })

      router.push("/")
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🍁</div>
          <CardTitle className="text-2xl">
            {step === 1 && "Create Your Account"}
            {step === 2 && "Your Background"}
            {step === 3 && "Language Scores"}
            {step === 4 && "Occupation"}
          </CardTitle>
          <CardDescription>
            Step {step} of 4 — {step === 1 && "Let's get started"}{step === 2 && "Tell us about your education and work"}{step === 3 && "Enter your IELTS band scores"}{step === 4 && "Almost done!"}
          </CardDescription>
          <div className="flex gap-2 justify-center pt-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send your bi-weekly immigration updates here
                </p>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!name || !email || !password) {
                    setError("All fields are required")
                    return
                  }
                  if (password.length < 6) {
                    setError("Password must be at least 6 characters")
                    return
                  }
                  setError("")
                  setStep(2)
                }}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    min={18}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Education</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Canadian Work (years)</Label>
                  <Select value={canadianWork.toString()} onValueChange={(v) => setCanadianWork(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y === 0 ? "None" : `${y}+ year${y > 1 ? "s" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Foreign Work (years)</Label>
                  <Select value={foreignWork.toString()} onValueChange={(v) => setForeignWork(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3].map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y === 0 ? "None" : `${y}+ year${y > 1 ? "s" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Switch checked={hasSpouse} onCheckedChange={setHasSpouse} />
                <Label>I have a spouse or common-law partner</Label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Back</Button>
                <Button className="w-full" onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your IELTS General band scores (0-9)</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Reading", value: reading, set: setReading },
                  { label: "Writing", value: writing, set: setWriting },
                  { label: "Listening", value: listening, set: setListening },
                  { label: "Speaking", value: speaking, set: setSpeaking },
                ].map((field) => (
                  <div key={field.label} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={9}
                      step={0.5}
                      value={field.value}
                      onChange={(e) => field.set(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Back</Button>
                <Button className="w-full" onClick={() => setStep(4)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>NOC Code (optional, 5-digit)</Label>
                <Input
                  placeholder="e.g. 21231"
                  value={nocCode}
                  onChange={(e) => setNocCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                />
                <p className="text-xs text-muted-foreground">
                  Your National Occupational Classification code. Find it at noc.esdc.gc.ca
                </p>
              </div>
              <div className="space-y-2">
                <Label>TEER Category (optional)</Label>
                <Select value={nocTeer} onValueChange={setNocTeer}>
                  <SelectTrigger><SelectValue placeholder="Select TEER" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">TEER 0 - Management</SelectItem>
                    <SelectItem value="1">TEER 1 - Professional</SelectItem>
                    <SelectItem value="2">TEER 2 - Technical</SelectItem>
                    <SelectItem value="3">TEER 3 - Intermediate</SelectItem>
                    <SelectItem value="4">TEER 4 - Entry level</SelectItem>
                    <SelectItem value="5">TEER 5 - Labour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <p className="font-medium">What you&apos;ll get:</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                  <li>Personalized CRS score & improvement tips</li>
                  <li>Program eligibility matching</li>
                  <li>Bi-weekly email updates with latest draws</li>
                  <li>Document expiry tracking</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="w-full" onClick={() => setStep(3)}>Back</Button>
                <Button className="w-full" onClick={handleSignup} disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
