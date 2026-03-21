"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Bell, Mail, MessageCircle, Save, Send, CheckCircle, AlertCircle } from "lucide-react"

interface Settings {
  telegramConfigured: boolean
  emailConfigured: boolean
  crsAlertThreshold: number
  enableTelegram: boolean
  enableEmail: boolean
  enableDrawAlerts: boolean
  enablePnpAlerts: boolean
  enableNewsAlerts: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testResult, setTestResult] = useState<{ type: string; success: boolean; message: string } | null>(null)

  // Form state
  const [telegramToken, setTelegramToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [email, setEmail] = useState("")
  const [crsThreshold, setCrsThreshold] = useState(500)
  const [enableTelegram, setEnableTelegram] = useState(false)
  const [enableEmail, setEnableEmail] = useState(false)
  const [enableDrawAlerts, setEnableDrawAlerts] = useState(true)
  const [enablePnpAlerts, setEnablePnpAlerts] = useState(true)
  const [enableNewsAlerts, setEnableNewsAlerts] = useState(false)

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()
      setSettings(data)
      setCrsThreshold(data.crsAlertThreshold || 500)
      setEnableTelegram(data.enableTelegram || false)
      setEnableEmail(data.enableEmail || false)
      setEnableDrawAlerts(data.enableDrawAlerts !== false)
      setEnablePnpAlerts(data.enablePnpAlerts !== false)
      setEnableNewsAlerts(data.enableNewsAlerts || false)
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        crsAlertThreshold: crsThreshold,
        enableTelegram,
        enableEmail,
        enableDrawAlerts,
        enablePnpAlerts,
        enableNewsAlerts,
      }

      // Only send credentials if they're filled in
      if (telegramToken) body.telegramBotToken = telegramToken
      if (telegramChatId) body.telegramChatId = telegramChatId
      if (email) body.emailAddress = email

      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      // Refresh settings
      fetchSettings()

      // Clear sensitive fields
      setTelegramToken("")
      setTelegramChatId("")
      setEmail("")
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const testNotification = async (type: "telegram" | "email") => {
    if (type === "telegram") setTestingTelegram(true)
    else setTestingEmail(true)

    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      const data = await response.json()
      setTestResult({
        type,
        success: data.success,
        message: data.message || data.error,
      })
    } catch (error) {
      setTestResult({
        type,
        success: false,
        message: "Failed to send test notification",
      })
    } finally {
      if (type === "telegram") setTestingTelegram(false)
      else setTestingEmail(false)
    }

    // Clear result after 5 seconds
    setTimeout(() => setTestResult(null), 5000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure how you want to receive alerts
        </p>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            testResult.success ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Telegram Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Telegram Notifications</CardTitle>
                <CardDescription>Receive instant alerts via Telegram bot</CardDescription>
              </div>
            </div>
            <Badge variant={settings?.telegramConfigured ? "default" : "secondary"}>
              {settings?.telegramConfigured ? "Configured" : "Not Set Up"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <Input
                type="password"
                placeholder={settings?.telegramConfigured ? "••••••••" : "Enter bot token from @BotFather"}
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Chat ID</Label>
              <Input
                placeholder={settings?.telegramConfigured ? "••••••••" : "Your Telegram chat ID"}
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={enableTelegram}
                onCheckedChange={setEnableTelegram}
                disabled={!settings?.telegramConfigured}
              />
              <Label>Enable Telegram notifications</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification("telegram")}
              disabled={!settings?.telegramConfigured || testingTelegram}
            >
              {testingTelegram ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
          </div>

          <div className="text-sm text-muted-foreground pt-2 border-t">
            <p className="font-medium mb-2">How to get your Telegram credentials:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Message @BotFather on Telegram and create a new bot</li>
              <li>Copy the bot token you receive</li>
              <li>Message @userinfobot to get your Chat ID</li>
              <li>Start a conversation with your new bot</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Receive alerts via email</CardDescription>
              </div>
            </div>
            <Badge variant={settings?.emailConfigured ? "default" : "secondary"}>
              {settings?.emailConfigured ? "Configured" : "Not Set Up"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder={settings?.emailConfigured ? "Email configured" : "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={enableEmail}
                onCheckedChange={setEnableEmail}
                disabled={!settings?.emailConfigured}
              />
              <Label>Enable email notifications</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification("email")}
              disabled={!settings?.emailConfigured || testingEmail}
            >
              {testingEmail ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-2 border-t">
            Email notifications require RESEND_API_KEY to be configured in environment variables.
          </p>
        </CardContent>
      </Card>

      {/* Alert Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Express Entry Draw Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when a new draw happens</p>
            </div>
            <Switch checked={enableDrawAlerts} onCheckedChange={setEnableDrawAlerts} />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="font-medium">PNP Draw Alerts</p>
              <p className="text-sm text-muted-foreground">Provincial Nominee Program draw notifications</p>
            </div>
            <Switch checked={enablePnpAlerts} onCheckedChange={setEnablePnpAlerts} />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="font-medium">IRCC News Updates</p>
              <p className="text-sm text-muted-foreground">Policy changes and processing time updates</p>
            </div>
            <Switch checked={enableNewsAlerts} onCheckedChange={setEnableNewsAlerts} />
          </div>

          <div className="pt-4 border-t">
            <Label>CRS Alert Threshold</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                type="number"
                min={300}
                max={700}
                value={crsThreshold}
                onChange={(e) => setCrsThreshold(parseInt(e.target.value) || 500)}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Get extra alert when CRS drops below this score
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={saving} className="w-full">
        {saving ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Settings
      </Button>
    </div>
  )
}
