import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { scrapeExpressEntryDraws } from "@/lib/scraper"
import { notifyNewDraw, notifyCrsThreshold } from "@/lib/telegram"
import { emailNotifyNewDraw, emailNotifyCrsThreshold } from "@/lib/email"
import { calculateCRS, type CrsProfile } from "@/lib/crs-calculator"
import { generateRecommendations } from "@/lib/recommendations"
import { sendDigestEmail } from "@/lib/digest"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    console.log("[CRON] Starting Express Entry monitor...")

    // 1. Scrape latest draws (live only — do not notify from bundled fallback)
    const { draws: scrapedDraws } = await scrapeExpressEntryDraws({
      allowFallback: false,
    })

    if (scrapedDraws.length === 0) {
      console.log("[CRON] No draws scraped")
      return NextResponse.json({ message: "No draws found", newDraws: 0 })
    }

    // 2. Find new draws
    const existingDraws = await prisma.draw.findMany({
      select: { drawNumber: true },
    })
    const existingDrawNumbers = new Set(existingDraws.map((d: { drawNumber: number }) => d.drawNumber))

    const newDraws = scrapedDraws.filter(
      (draw) => !existingDrawNumbers.has(draw.drawNumber)
    )

    // 3. Save new draws
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

    const notificationResults: Array<{ type: string; success: boolean; userId?: string }> = []

    // 4. Send notifications to ALL users
    const users = await prisma.user.findMany({
      include: { settings: true, profile: true },
    })

    for (const user of users) {
      const settings = user.settings
      const profileData = user.profile
      if (!settings || !profileData) continue

      // Build CRS profile
      const firstLanguageScores = JSON.parse(profileData.firstLanguageScores || '{"reading":6,"writing":6,"listening":6,"speaking":6}')
      const secondLanguageScores = profileData.secondLanguageScores ? JSON.parse(profileData.secondLanguageScores) : undefined
      const spouseLanguageScores = profileData.spouseLanguageScores ? JSON.parse(profileData.spouseLanguageScores) : undefined

      const crsProfile: CrsProfile = {
        age: profileData.age,
        educationLevel: profileData.educationLevel,
        firstLanguageScores,
        secondLanguageScores,
        canadianWorkYears: profileData.canadianWorkYears,
        foreignWorkYears: profileData.foreignWorkYears,
        hasSpouse: profileData.hasSpouse,
        spouseEducation: profileData.spouseEducation || undefined,
        spouseLanguageScores,
        spouseCanadianWork: profileData.spouseCanadianWork,
        provincialNomination: profileData.provincialNomination,
        jobOffer: profileData.jobOffer || undefined,
        canadianEducation: profileData.canadianEducation || undefined,
        frenchAbility: profileData.frenchAbility || undefined,
        sibling: profileData.sibling,
      }

      const breakdown = calculateCRS(crsProfile)
      const yourCrs = breakdown.total
      const recommendations = generateRecommendations(crsProfile, breakdown)

      // Send new draw alerts
      for (const draw of newDraws) {
        if (settings.enableTelegram && settings.telegramBotToken && settings.telegramChatId) {
          const r1 = await notifyNewDraw(
            { botToken: settings.telegramBotToken, chatId: settings.telegramChatId },
            draw
          )
          notificationResults.push({ type: "telegram-draw", success: r1, userId: user.id })

          const r2 = await notifyCrsThreshold(
            { botToken: settings.telegramBotToken, chatId: settings.telegramChatId },
            draw,
            yourCrs
          )
          notificationResults.push({ type: "telegram-crs", success: r2, userId: user.id })
        }

        if (settings.enableEmail && settings.emailAddress) {
          const r1 = await emailNotifyNewDraw({ to: settings.emailAddress }, draw)
          notificationResults.push({ type: "email-draw", success: r1, userId: user.id })

          const r2 = await emailNotifyCrsThreshold({ to: settings.emailAddress }, draw, yourCrs)
          notificationResults.push({ type: "email-crs", success: r2, userId: user.id })
        }
      }

      // Send bi-weekly digest email (only if email enabled)
      if (settings.enableEmail && settings.emailAddress) {
        // Get recent draws for digest
        const recentDraws = await prisma.draw.findMany({
          orderBy: { drawDate: "desc" },
          take: 5,
        })

        const digestResult = await sendDigestEmail(
          { to: settings.emailAddress },
          user.name,
          yourCrs,
          recommendations.slice(0, 3),
          recentDraws
        )
        notificationResults.push({ type: "email-digest", success: digestResult, userId: user.id })
      }
    }

    console.log(`[CRON] Processed ${newDraws.length} new draw(s), notified ${users.length} user(s)`)

    return NextResponse.json({
      message: "Monitoring complete",
      newDraws: newDraws.length,
      usersNotified: users.length,
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
