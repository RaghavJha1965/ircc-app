const IRCC_JSON_URL =
  "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_4_en.json"

/** Keep under Vercel Hobby's 10s function limit; override via IRCC_FETCH_TIMEOUT_MS */
function irccFetchTimeoutMs(): number {
  const raw = parseInt(process.env.IRCC_FETCH_TIMEOUT_MS || "", 10)
  if (Number.isFinite(raw) && raw >= 2000) return Math.min(raw, 55000)
  return 7000
}

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

interface IRCCRound {
  drawNumber: number | string
  drawDateFull: string
  drawName: string
  drawCRS: number | string
  drawSize: string
  drawCutOff?: string
}

// Fetch Express Entry draws from IRCC JSON API
export async function scrapeExpressEntryDraws(): Promise<ExpressEntryDraw[]> {
  try {
    const response = await fetch(IRCC_JSON_URL, {
      signal: AbortSignal.timeout(irccFetchTimeoutMs()),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json,text/html,*/*",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch IRCC data: ${response.status}`)
    }

    const data = await response.json()
    const rounds: Record<string, IRCCRound> = data.rounds || {}
    const draws: ExpressEntryDraw[] = []

    for (const key of Object.keys(rounds)) {
      const round = rounds[key]

      const drawNumber = typeof round.drawNumber === "string"
        ? parseInt(round.drawNumber, 10)
        : round.drawNumber

      const crsScore = typeof round.drawCRS === "string"
        ? parseInt(round.drawCRS.replace(/[^\d]/g, ""), 10)
        : round.drawCRS

      const itasIssued = parseInt(
        String(round.drawSize).replace(/[^\d]/g, ""),
        10
      ) || 0

      const drawDate = parseIRCCDate(round.drawDateFull)

      let tieBreakDate: Date | undefined
      if (round.drawCutOff && !round.drawCutOff.toLowerCase().includes("n/a")) {
        const parsed = parseIRCCDate(round.drawCutOff)
        if (parsed.getTime() !== new Date().getTime()) {
          tieBreakDate = parsed
        }
      }

      if (drawNumber && crsScore) {
        draws.push({
          drawNumber,
          drawDate,
          drawName: round.drawName || "No program specified",
          crsScore,
          itasIssued,
          tieBreakDate,
        })
      }
    }

    // Sort by draw number descending
    draws.sort((a, b) => b.drawNumber - a.drawNumber)

    return draws
  } catch (error) {
    console.error("Error fetching Express Entry draws:", error)
    throw error
  }
}

// Parse IRCC date formats like "March 18, 2026" or "2024-01-10"
function parseIRCCDate(dateText: string): Date {
  if (!dateText) return new Date()

  // Try ISO format
  const isoDate = new Date(dateText)
  if (!isNaN(isoDate.getTime())) {
    return isoDate
  }

  // Try "Month DD, YYYY" format
  const monthMatch = dateText.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i)
  if (monthMatch) {
    const monthNames = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december",
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

  return new Date()
}

// Get the latest draw
export async function getLatestDraw(): Promise<ExpressEntryDraw | null> {
  const draws = await scrapeExpressEntryDraws()
  return draws.length > 0 ? draws[0] : null
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

export async function scrapeOINPDraws(): Promise<PnpDrawInfo[]> {
  return []
}
