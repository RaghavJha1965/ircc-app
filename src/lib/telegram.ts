import type { ExpressEntryDraw } from "./scraper"

const TELEGRAM_API_BASE = "https://api.telegram.org/bot"

interface TelegramConfig {
  botToken: string
  chatId: string
}

// Send a message via Telegram
export async function sendTelegramMessage(
  config: TelegramConfig,
  message: string
): Promise<boolean> {
  if (!config.botToken || !config.chatId) {
    console.warn("Telegram not configured - skipping notification")
    return false
  }

  try {
    const url = `${TELEGRAM_API_BASE}${config.botToken}/sendMessage`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Telegram API error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending Telegram message:", error)
    return false
  }
}

// Format Express Entry draw notification
export function formatDrawNotification(draw: ExpressEntryDraw): string {
  const dateStr = draw.drawDate.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return `
<b>NEW Express Entry Draw #${draw.drawNumber}</b>

<b>Date:</b> ${dateStr}
<b>Program:</b> ${draw.drawName}
<b>CRS Score:</b> ${draw.crsScore}
<b>ITAs Issued:</b> ${draw.itasIssued.toLocaleString()}

Check your profile: https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html
`.trim()
}

// Send draw notification
export async function notifyNewDraw(
  config: TelegramConfig,
  draw: ExpressEntryDraw
): Promise<boolean> {
  const message = formatDrawNotification(draw)
  return sendTelegramMessage(config, message)
}

// Send CRS threshold alert
export async function notifyCrsThreshold(
  config: TelegramConfig,
  draw: ExpressEntryDraw,
  yourCrs: number
): Promise<boolean> {
  const aboveBelow = yourCrs >= draw.crsScore ? "ABOVE" : "below"
  const emoji = yourCrs >= draw.crsScore ? "✅" : "⚠️"

  const message = `
${emoji} <b>CRS Alert</b>

Latest draw CRS: <b>${draw.crsScore}</b>
Your CRS: <b>${yourCrs}</b>

You are ${aboveBelow} the cutoff by ${Math.abs(yourCrs - draw.crsScore)} points.

${yourCrs >= draw.crsScore ? "Congratulations! You may receive an ITA soon!" : "Keep improving your profile!"}
`.trim()

  return sendTelegramMessage(config, message)
}

// Test Telegram connection
export async function testTelegramConnection(
  config: TelegramConfig
): Promise<boolean> {
  const message = `
<b>IRCC Tracker Connected!</b>

You will now receive notifications for:
• New Express Entry draws
• CRS score updates
• PNP draw alerts
`.trim()

  return sendTelegramMessage(config, message)
}
