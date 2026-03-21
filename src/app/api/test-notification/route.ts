import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { testTelegramConnection } from "@/lib/telegram"
import { sendTestEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

// POST /api/test-notification - Send test notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body // "telegram" or "email"

    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    })

    if (!settings) {
      return NextResponse.json(
        { error: "Settings not configured" },
        { status: 400 }
      )
    }

    if (type === "telegram") {
      if (!settings.telegramBotToken || !settings.telegramChatId) {
        return NextResponse.json(
          { error: "Telegram not configured. Please set bot token and chat ID." },
          { status: 400 }
        )
      }

      const success = await testTelegramConnection({
        botToken: settings.telegramBotToken,
        chatId: settings.telegramChatId,
      })

      return NextResponse.json({
        success,
        message: success ? "Test message sent to Telegram!" : "Failed to send Telegram message",
      })
    }

    if (type === "email") {
      if (!settings.emailAddress) {
        return NextResponse.json(
          { error: "Email not configured. Please set your email address." },
          { status: 400 }
        )
      }

      const success = await sendTestEmail({
        to: settings.emailAddress,
      })

      return NextResponse.json({
        success,
        message: success ? "Test email sent!" : "Failed to send email",
      })
    }

    return NextResponse.json(
      { error: "Invalid notification type. Use 'telegram' or 'email'." },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error testing notification:", error)
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    )
  }
}
