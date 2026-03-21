import { Resend } from "resend"
import type { ExpressEntryDraw } from "./scraper"

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend API key not configured")
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

interface EmailConfig {
  to: string
}

// Send an email notification
export async function sendEmail(
  config: EmailConfig,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  const client = getResendClient()
  if (!client || !config.to) {
    console.warn("Email not configured - skipping notification")
    return false
  }

  try {
    const { error } = await client.emails.send({
      from: "IRCC Tracker <onboarding@resend.dev>",
      to: config.to,
      subject,
      html: htmlContent,
    })

    if (error) {
      console.error("Email send error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

// Format Express Entry draw email
export function formatDrawEmail(draw: ExpressEntryDraw): {
  subject: string
  html: string
} {
  const dateStr = draw.drawDate.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const subject = `Express Entry Draw #${draw.drawNumber} - CRS ${draw.crsScore}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .stat { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
    .stat-label { color: #6b7280; font-size: 14px; }
    .stat-value { color: #111827; font-size: 24px; font-weight: bold; }
    .cta { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Express Entry Draw!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Draw #${draw.drawNumber}</p>
    </div>
    <div class="content">
      <div class="stat">
        <div class="stat-label">CRS Score Cutoff</div>
        <div class="stat-value">${draw.crsScore}</div>
      </div>
      <div class="stat">
        <div class="stat-label">ITAs Issued</div>
        <div class="stat-value">${draw.itasIssued.toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Draw Date</div>
        <div class="stat-value">${dateStr}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Program</div>
        <div class="stat-value" style="font-size: 18px;">${draw.drawName}</div>
      </div>
      <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html" class="cta">
        Check Your Profile
      </a>
      <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
        This notification was sent by your IRCC Tracker.
        Visit your dashboard to update notification settings.
      </p>
    </div>
  </div>
</body>
</html>
`.trim()

  return { subject, html }
}

// Send draw notification email
export async function emailNotifyNewDraw(
  config: EmailConfig,
  draw: ExpressEntryDraw
): Promise<boolean> {
  const { subject, html } = formatDrawEmail(draw)
  return sendEmail(config, subject, html)
}

// Send CRS threshold alert email
export async function emailNotifyCrsThreshold(
  config: EmailConfig,
  draw: ExpressEntryDraw,
  yourCrs: number
): Promise<boolean> {
  const aboveBelow = yourCrs >= draw.crsScore ? "ABOVE" : "below"
  const statusColor = yourCrs >= draw.crsScore ? "#22c55e" : "#eab308"
  const diff = Math.abs(yourCrs - draw.crsScore)

  const subject = yourCrs >= draw.crsScore
    ? `You're above the CRS cutoff! (${yourCrs} vs ${draw.crsScore})`
    : `CRS Alert: You're ${diff} points below the cutoff`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .stat { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${statusColor}; }
    .stat-label { color: #6b7280; font-size: 14px; }
    .stat-value { color: #111827; font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${yourCrs >= draw.crsScore ? "You May Receive an ITA!" : "CRS Threshold Alert"}</h1>
    </div>
    <div class="content">
      <div class="stat">
        <div class="stat-label">Your CRS Score</div>
        <div class="stat-value">${yourCrs}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Draw #${draw.drawNumber} Cutoff</div>
        <div class="stat-value">${draw.crsScore}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Status</div>
        <div class="stat-value" style="font-size: 18px;">You are ${aboveBelow} the cutoff by ${diff} points</div>
      </div>
      <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
        This notification was sent by your IRCC Tracker.
      </p>
    </div>
  </div>
</body>
</html>
`.trim()

  return sendEmail(config, subject, html)
}

// Send test email
export async function sendTestEmail(config: EmailConfig): Promise<boolean> {
  const subject = "IRCC Tracker - Connection Test"
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Email Connected!</h1>
      <p style="margin: 10px 0 0 0;">Your IRCC Tracker is now set up</p>
    </div>
    <div style="padding: 20px;">
      <p>You will receive email notifications for:</p>
      <ul>
        <li>New Express Entry draws</li>
        <li>CRS score updates</li>
        <li>PNP draw alerts</li>
      </ul>
    </div>
  </div>
</body>
</html>
`.trim()

  return sendEmail(config, subject, html)
}
