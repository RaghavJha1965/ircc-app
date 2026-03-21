import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { testTelegramConnection } from "@/lib/telegram"
import { sendTestEmail } from "@/lib/email"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    const settings = await prisma.settings.findUnique({
      where: { userId: session.id },
    })

    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 })
    }

    if (type === "telegram") {
      if (!settings.telegramBotToken || !settings.telegramChatId) {
        return NextResponse.json({ error: "Telegram not configured" }, { status: 400 })
      }
      const success = await testTelegramConnection({
        botToken: settings.telegramBotToken,
        chatId: settings.telegramChatId,
      })
      return NextResponse.json({ success, message: success ? "Test message sent!" : "Failed to send" })
    }

    if (type === "email") {
      if (!settings.emailAddress) {
        return NextResponse.json({ error: "Email not configured" }, { status: 400 })
      }
      const success = await sendTestEmail({ to: settings.emailAddress })
      return NextResponse.json({ success, message: success ? "Test email sent!" : "Failed to send" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Error testing notification:", error)
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 })
  }
}
