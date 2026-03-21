import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { scrapeExpressEntryDraws } from "@/lib/scraper"
import { notifyNewDraw, notifyCrsThreshold } from "@/lib/telegram"
import { emailNotifyNewDraw, emailNotifyCrsThreshold } from "@/lib/email"
import { calculateCRS, type CrsProfile } from "@/lib/crs-calculator"

// This endpoint is called by Vercel Cron Jobs
// Configure in vercel.json to run every hour

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Skip auth check in development
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    console.log("[CRON] Starting Express Entry monitor...")

    // 1. Scrape latest draws from IRCC
    const scrapedDraws = await scrapeExpressEntryDraws()

    if (scrapedDraws.length === 0) {
      console.log("[CRON] No draws scraped")
      return NextResponse.json({ message: "No draws found", newDraws: 0 })
    }

    // 2. Get existing draw numbers from database
    const existingDraws = await prisma.draw.findMany({
      select: { drawNumber: true },
    })
    const existingDrawNumbers = new Set(existingDraws.map((d: { drawNumber: number }) => d.drawNumber))

    // 3. Find new draws that don't exist in database
    const newDraws = scrapedDraws.filter(
      (draw) => !existingDrawNumbers.has(draw.drawNumber)
    )

    if (newDraws.length === 0) {
      console.log("[CRON] No new draws detected")
      return NextResponse.json({ message: "No new draws", newDraws: 0 })
    }

    console.log(`[CRON] Found ${newDraws.length} new draw(s)`)

    // 4. Save new draws to database
    for (const draw of newDraws) {
      await prisma.draw.create({
        data: {
          drawNumber: draw.drawNumber,
          drawDate: draw.drawDate,
          drawName: draw.drawName,
          crsScore: draw.crsScore,
          itasIssued: draw.itasIssued,
          tieBreakDate: draw.tieBreakDate,
        },
      })
    }

    // 5. Get settings for notifications
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    })

    // 6. Send notifications for each new draw
    const notificationResults = []

    for (const draw of newDraws) {
      // Telegram notification
      if (settings?.enableTelegram && settings?.telegramBotToken && settings?.telegramChatId) {
        const telegramResult = await notifyNewDraw(
          {
            botToken: settings.telegramBotToken,
            chatId: settings.telegramChatId,
          },
          draw
        )
        notificationResults.push({ type: "telegram", success: telegramResult })
      }

      // Email notification
      if (settings?.enableEmail && settings?.emailAddress) {
        const emailResult = await emailNotifyNewDraw(
          { to: settings.emailAddress },
          draw
        )
        notificationResults.push({ type: "email", success: emailResult })
      }
    }

    // 7. Send CRS threshold alerts
    if (settings?.enableDrawAlerts) {
      try {
        const crsProfileData = await prisma.crsProfile.findUnique({
          where: { id: "default" },
        })

        if (crsProfileData) {
          const firstLanguageScores = JSON.parse(crsProfileData.firstLanguageScores || '{"reading":6,"writing":6,"listening":6,"speaking":6}')
          const secondLanguageScores = crsProfileData.secondLanguageScores ? JSON.parse(crsProfileData.secondLanguageScores) : undefined
          const spouseLanguageScores = crsProfileData.spouseLanguageScores ? JSON.parse(crsProfileData.spouseLanguageScores) : undefined

          const crsProfile: CrsProfile = {
            age: crsProfileData.age,
            educationLevel: crsProfileData.educationLevel,
            firstLanguageScores,
            secondLanguageScores,
            canadianWorkYears: crsProfileData.canadianWorkYears,
            foreignWorkYears: crsProfileData.foreignWorkYears,
            hasSpouse: crsProfileData.hasSpouse,
            spouseEducation: crsProfileData.spouseEducation || undefined,
            spouseLanguageScores,
            spouseCanadianWork: crsProfileData.spouseCanadianWork,
            provincialNomination: crsProfileData.provincialNomination,
            jobOffer: crsProfileData.jobOffer || undefined,
            canadianEducation: crsProfileData.canadianEducation || undefined,
            frenchAbility: crsProfileData.frenchAbility || undefined,
            sibling: crsProfileData.sibling,
          }

          const breakdown = calculateCRS(crsProfile)
          const yourCrs = breakdown.total

          for (const draw of newDraws) {
            if (settings.enableTelegram && settings.telegramBotToken && settings.telegramChatId) {
              const result = await notifyCrsThreshold(
                { botToken: settings.telegramBotToken, chatId: settings.telegramChatId },
                draw,
                yourCrs
              )
              notificationResults.push({ type: "telegram-crs", success: result })
            }

            if (settings.enableEmail && settings.emailAddress) {
              const result = await emailNotifyCrsThreshold(
                { to: settings.emailAddress },
                draw,
                yourCrs
              )
              notificationResults.push({ type: "email-crs", success: result })
            }
          }
        }
      } catch (crsError) {
        console.error("[CRON] Error sending CRS threshold alerts:", crsError)
      }
    }

    console.log(`[CRON] Saved ${newDraws.length} new draw(s) and sent notifications`)

    return NextResponse.json({
      message: "Monitoring complete",
      newDraws: newDraws.length,
      draws: newDraws.map((d) => ({
        number: d.drawNumber,
        crs: d.crsScore,
        date: d.drawDate,
      })),
      notifications: notificationResults,
    })
  } catch (error) {
    console.error("[CRON] Error:", error)
    return NextResponse.json(
      { error: "Monitoring failed", details: String(error) },
      { status: 500 }
    )
  }
}
