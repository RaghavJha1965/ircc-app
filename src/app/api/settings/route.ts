import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let settings = await prisma.settings.findUnique({
      where: { userId: session.id },
    })

    if (!settings) {
      settings = await prisma.settings.create({
        data: { userId: session.id, emailAddress: session.email, enableEmail: true },
      })
    }

    return NextResponse.json({
      telegramConfigured: !!settings.telegramBotToken && !!settings.telegramChatId,
      emailConfigured: !!settings.emailAddress,
      crsAlertThreshold: settings.crsAlertThreshold,
      enableTelegram: settings.enableTelegram,
      enableEmail: settings.enableEmail,
      enableDrawAlerts: settings.enableDrawAlerts,
      enablePnpAlerts: settings.enablePnpAlerts,
      enableNewsAlerts: settings.enableNewsAlerts,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.telegramBotToken !== undefined) updateData.telegramBotToken = body.telegramBotToken
    if (body.telegramChatId !== undefined) updateData.telegramChatId = body.telegramChatId
    if (body.emailAddress !== undefined) updateData.emailAddress = body.emailAddress
    if (body.crsAlertThreshold !== undefined) updateData.crsAlertThreshold = parseInt(body.crsAlertThreshold, 10)
    if (body.enableTelegram !== undefined) updateData.enableTelegram = body.enableTelegram
    if (body.enableEmail !== undefined) updateData.enableEmail = body.enableEmail
    if (body.enableDrawAlerts !== undefined) updateData.enableDrawAlerts = body.enableDrawAlerts
    if (body.enablePnpAlerts !== undefined) updateData.enablePnpAlerts = body.enablePnpAlerts
    if (body.enableNewsAlerts !== undefined) updateData.enableNewsAlerts = body.enableNewsAlerts

    const settings = await prisma.settings.upsert({
      where: { userId: session.id },
      update: updateData,
      create: { userId: session.id, ...updateData },
    })

    return NextResponse.json({
      success: true,
      telegramConfigured: !!settings.telegramBotToken && !!settings.telegramChatId,
      emailConfigured: !!settings.emailAddress,
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
