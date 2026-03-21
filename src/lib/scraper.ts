import * as cheerio from "cheerio"

const IRCC_DRAWS_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/rounds-invitations.html"

export interface ExpressEntryDraw {
  drawNumber: number
  drawDate: Date
  drawName: string
  crsScore: number
  itasIssued: number
  tieBreakDate?: Date
}

export interface PnpDrawInfo {
  province: string
  stream: string
  drawDate: Date
  minScore?: number
  itasIssued?: number
  nocCodes?: string
}

// Fetch and parse Express Entry draws from IRCC website
export async function scrapeExpressEntryDraws(): Promise<ExpressEntryDraw[]> {
  try {
    const response = await fetch(IRCC_DRAWS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch IRCC page: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const draws: ExpressEntryDraw[] = []

    // The IRCC website has a table with draw information
    // Table structure: Draw number, Date, Program, Invitations issued, CRS score, tie-breaking rule
    $("table tbody tr").each((_, row) => {
      const cells = $(row).find("td")
      if (cells.length >= 5) {
        const drawNumberText = $(cells[0]).text().trim()
        const drawNumber = parseInt(drawNumberText.replace(/[^\d]/g, ""), 10)

        const dateText = $(cells[1]).text().trim()
        const drawDate = parseIRCCDate(dateText)

        const drawName = $(cells[2]).text().trim() || "No program specified"

        const itasText = $(cells[3]).text().trim()
        const itasIssued = parseInt(itasText.replace(/[^\d]/g, ""), 10) || 0

        const crsText = $(cells[4]).text().trim()
        const crsScore = parseInt(crsText.replace(/[^\d]/g, ""), 10) || 0

        // Tie-breaking date (if available)
        let tieBreakDate: Date | undefined
        if (cells.length > 5) {
          const tieBreakText = $(cells[5]).text().trim()
          if (tieBreakText && !tieBreakText.toLowerCase().includes("n/a")) {
            tieBreakDate = parseIRCCDate(tieBreakText)
          }
        }

        if (drawNumber && crsScore) {
          draws.push({
            drawNumber,
            drawDate,
            drawName,
            crsScore,
            itasIssued,
            tieBreakDate,
          })
        }
      }
    })

    return draws
  } catch (error) {
    console.error("Error scraping Express Entry draws:", error)
    throw error
  }
}

// Parse IRCC date formats like "January 10, 2024" or "2024-01-10"
function parseIRCCDate(dateText: string): Date {
  // Try parsing ISO format first
  const isoDate = new Date(dateText)
  if (!isNaN(isoDate.getTime())) {
    return isoDate
  }

  // Try parsing "Month DD, YYYY" format
  const monthMatch = dateText.match(
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i
  )
  if (monthMatch) {
    const monthNames = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ]
    const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase())
    if (monthIndex !== -1) {
      return new Date(
        parseInt(monthMatch[3], 10),
        monthIndex,
        parseInt(monthMatch[2], 10)
      )
    }
  }

  // Default to current date if parsing fails
  return new Date()
}

// Get the latest draw from the scraped data
export async function getLatestDraw(): Promise<ExpressEntryDraw | null> {
  const draws = await scrapeExpressEntryDraws()
  if (draws.length === 0) return null

  // Sort by draw number descending and return the first
  return draws.sort((a, b) => b.drawNumber - a.drawNumber)[0]
}

// Calculate statistics from draws
export function calculateDrawStats(draws: ExpressEntryDraw[]) {
  if (draws.length === 0) {
    return {
      averageCrs: 0,
      lowestCrs: 0,
      highestCrs: 0,
      totalItas: 0,
      drawsThisYear: 0,
    }
  }

  const currentYear = new Date().getFullYear()
  const thisYearDraws = draws.filter(
    (d) => d.drawDate.getFullYear() === currentYear
  )

  const crsScores = draws.map((d) => d.crsScore)
  const averageCrs = Math.round(
    crsScores.reduce((a, b) => a + b, 0) / crsScores.length
  )
  const lowestCrs = Math.min(...crsScores)
  const highestCrs = Math.max(...crsScores)
  const totalItas = draws.reduce((sum, d) => sum + d.itasIssued, 0)

  return {
    averageCrs,
    lowestCrs,
    highestCrs,
    totalItas,
    drawsThisYear: thisYearDraws.length,
  }
}

// OINP scraper (simplified - OINP doesn't have a public API)
// You may need to adjust based on the actual website structure
export async function scrapeOINPDraws(): Promise<PnpDrawInfo[]> {
  // OINP website structure changes frequently
  // For now, return empty array - can be implemented when needed
  return []
}
