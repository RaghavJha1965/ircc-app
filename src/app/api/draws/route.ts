import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { scrapeExpressEntryDraws, calculateDrawStats } from "@/lib/scraper"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// GET /api/draws - Get all draws from database
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "20", 10)
  const refresh = searchParams.get("refresh") === "true"

  let refreshFailed = false

  try {
    if (refresh) {
      try {
        const scrapedDraws = await scrapeExpressEntryDraws()

        const existing = await prisma.draw.findMany({
          select: { drawNumber: true },
        })
        const existingNumbers = new Set(
          existing.map((d: { drawNumber: number }) => d.drawNumber)
        )

        const newDraws = scrapedDraws
          .filter((d) => !existingNumbers.has(d.drawNumber))
          .slice(0, 10)

        const toCreate =
          existing.length === 0 && scrapedDraws.length > 10
            ? [...newDraws, ...scrapedDraws.slice(10, 20)]
            : newDraws

        for (const draw of toCreate) {
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
      } catch (err) {
        console.error("Draw refresh from IRCC failed:", err)
        refreshFailed = true
      }
    }

    // Get draws from database
    const draws = await prisma.draw.findMany({
      orderBy: { drawNumber: "desc" },
      take: limit,
    })

    // Calculate statistics from what we have
    const allDraws = await prisma.draw.findMany()
    type DrawRow = (typeof allDraws)[number]
    const stats = calculateDrawStats(
      allDraws.map((d: DrawRow) => ({
        drawNumber: d.drawNumber,
        drawDate: d.drawDate,
        drawName: d.drawName,
        crsScore: d.crsScore,
        itasIssued: d.itasIssued,
        tieBreakDate: d.tieBreakDate ?? undefined,
      }))
    )

    return NextResponse.json({
      draws,
      stats,
      count: draws.length,
      ...(refresh ? { refreshFailed } : {}),
    })
  } catch (error) {
    console.error("Error fetching draws:", error)
    return NextResponse.json(
      { error: "Failed to fetch draws" },
      { status: 500 }
    )
  }
}
