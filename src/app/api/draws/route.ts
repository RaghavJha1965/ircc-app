import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { scrapeExpressEntryDraws, calculateDrawStats } from "@/lib/scraper"

export const dynamic = "force-dynamic"

// GET /api/draws - Get all draws from database
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "20", 10)
  const refresh = searchParams.get("refresh") === "true"

  try {
    // If refresh is requested, scrape and update the database
    if (refresh) {
      const scrapedDraws = await scrapeExpressEntryDraws()

      for (const draw of scrapedDraws) {
        await prisma.draw.upsert({
          where: { drawNumber: draw.drawNumber },
          update: {
            drawDate: draw.drawDate,
            drawName: draw.drawName,
            crsScore: draw.crsScore,
            itasIssued: draw.itasIssued,
            tieBreakDate: draw.tieBreakDate,
          },
          create: {
            drawNumber: draw.drawNumber,
            drawDate: draw.drawDate,
            drawName: draw.drawName,
            crsScore: draw.crsScore,
            itasIssued: draw.itasIssued,
            tieBreakDate: draw.tieBreakDate,
          },
        })
      }
    }

    // Get draws from database
    const draws = await prisma.draw.findMany({
      orderBy: { drawNumber: "desc" },
      take: limit,
    })

    // Calculate statistics
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
    })
  } catch (error) {
    console.error("Error fetching draws:", error)
    return NextResponse.json(
      { error: "Failed to fetch draws" },
      { status: 500 }
    )
  }
}
