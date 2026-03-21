import { sendEmail } from "./email"
import type { Recommendation } from "./recommendations"

interface DigestDraw {
  drawNumber: number
  drawDate: Date
  drawName: string
  crsScore: number
  itasIssued: number
}

export async function sendDigestEmail(
  config: { to: string },
  userName: string,
  crsScore: number,
  topRecommendations: Recommendation[],
  recentDraws: DigestDraw[]
): Promise<boolean> {
  const subject = `Your IRCC Weekly Update - CRS ${crsScore}`

  const drawRows = recentDraws
    .map(
      (d) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">#${d.drawNumber}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${d.drawDate.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${d.crsScore}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${d.itasIssued.toLocaleString()}</td>
      </tr>`
    )
    .join("")

  const tipsList = topRecommendations
    .map(
      (r) => `
      <div style="background: white; padding: 12px 16px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #d7406d;">
        <strong>+${r.pointsGain} points:</strong> ${r.title}
        <br><span style="color: #6b7280; font-size: 13px;">${r.description}</span>
      </div>`
    )
    .join("")

  const latestCutoff = recentDraws.length > 0 ? recentDraws[0].crsScore : 0
  const aboveBelow = crsScore >= latestCutoff
  const diff = Math.abs(crsScore - latestCutoff)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #d7406d, #b8335a); color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 22px;">🍁 Your Immigration Update</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Hi ${userName}, here's your personalized report</p>
    </div>
    <div class="content">
      <!-- CRS Status -->
      <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Your CRS Score</p>
        <p style="margin: 4px 0; font-size: 48px; font-weight: bold; color: #d7406d;">${crsScore}</p>
        ${latestCutoff > 0 ? `<p style="margin: 0; font-size: 14px; color: ${aboveBelow ? "#22c55e" : "#eab308"};">
          You are <strong>${aboveBelow ? "above" : "below"}</strong> the latest cutoff (${latestCutoff}) by ${diff} points
        </p>` : ""}
      </div>

      <!-- Recent Draws -->
      <h2 style="font-size: 16px; margin: 20px 0 12px 0;">Recent Express Entry Draws</h2>
      <table>
        <thead>
          <tr>
            <th>Draw</th>
            <th>Date</th>
            <th>CRS</th>
            <th>ITAs</th>
          </tr>
        </thead>
        <tbody>
          ${drawRows || '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">No recent draws</td></tr>'}
        </tbody>
      </table>

      <!-- Top Recommendations -->
      ${topRecommendations.length > 0 ? `
      <h2 style="font-size: 16px; margin: 20px 0 12px 0;">Top Ways to Improve Your Score</h2>
      ${tipsList}
      ` : ""}

      <!-- Footer -->
      <p style="margin-top: 24px; color: #6b7280; font-size: 12px; text-align: center;">
        You're receiving this because you signed up for IRCC Tracker updates.
        <br>Visit your dashboard to update your profile or notification preferences.
      </p>
    </div>
  </div>
</body>
</html>
`.trim()

  return sendEmail(config, subject, html)
}
