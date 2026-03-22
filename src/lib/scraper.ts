import * as fs from "node:fs"
import * as https from "node:https"
import * as path from "node:path"
import { URL } from "node:url"

import fallbackPayload from "@/data/ircc-ee-rounds-fallback.json"

const IRCC_JSON_URL =
  "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_4_en.json"

/** Keep under Vercel Hobby's 10s function limit; override via IRCC_FETCH_TIMEOUT_MS */
function irccFetchTimeoutMs(): number {
  const raw = parseInt(process.env.IRCC_FETCH_TIMEOUT_MS || "", 10)
  if (Number.isFinite(raw) && raw >= 2000) return Math.min(raw, 55000)
  return 8500
}

/**
 * IRCC sits behind Akamai; Node's fetch (HTTP/2) and IPv6-first resolution sometimes
 * stall or error from cloud hosts. Use HTTP/1.1 + IPv4 for a more reliable path.
 */
function fetchIrccJsonText(timeoutMs: number): Promise<string> {
  const target = new URL(IRCC_JSON_URL)
  return new Promise((resolve, reject) => {
    let done = false
    const finish = (fn: () => void) => {
      if (done) return
      done = true
      clearTimeout(timer)
      fn()
    }

    const timer = setTimeout(() => {
      req.destroy()
      finish(() => reject(new Error(`IRCC fetch timed out after ${timeoutMs}ms`)))
    }, timeoutMs)

    const req = https.request(
      {
        hostname: target.hostname,
        port: 443,
        path: target.pathname + target.search,
        method: "GET",
        servername: target.hostname,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json,text/plain,*/*",
          "Accept-Encoding": "identity",
          Connection: "close",
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          finish(() =>
            reject(new Error(`Failed to fetch IRCC data: ${res.statusCode}`))
          )
          return
        }
        const chunks: Buffer[] = []
        res.on("data", (chunk) => chunks.push(chunk))
        res.on("end", () => {
          finish(() => resolve(Buffer.concat(chunks).toString("utf8")))
        })
        res.on("error", (err) => {
          finish(() => reject(err))
        })
      }
    )

    req.on("error", (err) => {
      finish(() => reject(err))
    })

    req.end()
  })
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

/** live = canada.ca JSON; static = your deployment or DRAWS_JSON_URLS; fallback = bundled import */
export type ScrapeSource = "live" | "static" | "fallback"

export interface ScrapeExpressEntryResult {
  draws: ExpressEntryDraw[]
  source: ScrapeSource
}

function parseIrccRoundsPayload(data: {
  rounds?: Record<string, IRCCRound>
}): ExpressEntryDraw[] {
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

    const itasIssued =
      parseInt(String(round.drawSize).replace(/[^\d]/g, ""), 10) || 0

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

  draws.sort((a, b) => b.drawNumber - a.drawNumber)
  return draws
}

/** Fast fetch for mirrors (GitHub raw, same-origin static on Vercel, etc.) — works well on Hobby. */
async function fetchDrawsJsonUrl(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent":
        "Mozilla/5.0 (compatible; IRCC-Tracker/1.0; +https://vercel.com)",
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  const text = await res.text()
  if (!text.includes('"rounds"')) {
    throw new Error(`No rounds in response from ${url}`)
  }
  return text
}

/** Same file as static URL https://<VERCEL_URL>/draws/ee-rounds.json — read from disk when present (local dev; sometimes on server). */
function tryReadPublicDrawsFile(): string | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "draws",
      "ee-rounds.json"
    )
    if (!fs.existsSync(filePath)) return null
    const text = fs.readFileSync(filePath, "utf8")
    return text.includes('"rounds"') ? text : null
  } catch {
    return null
  }
}

function mirrorUrlsForHobby(): string[] {
  const urls: string[] = []
  const fromEnv = process.env.DRAWS_JSON_URLS?.split(/[\s,]+/).filter(Boolean) ?? []
  urls.push(...fromEnv)
  const vercel = process.env.VERCEL_URL
  if (vercel) {
    urls.push(`https://${vercel}/draws/ee-rounds.json`)
  }
  return [...new Set(urls)]
}

async function firstMirrorJson(timeoutMs: number): Promise<string> {
  const urls = mirrorUrlsForHobby()
  if (urls.length === 0) {
    throw new Error("No mirror URLs configured")
  }
  return Promise.any(urls.map((url) => fetchDrawsJsonUrl(url, timeoutMs)))
}

export async function scrapeExpressEntryDraws(options?: {
  allowFallback?: boolean
}): Promise<ScrapeExpressEntryResult> {
  const allowFallback = options?.allowFallback !== false

  if (!allowFallback) {
    const text = await fetchIrccJsonText(irccFetchTimeoutMs())
    const draws = parseIrccRoundsPayload(
      JSON.parse(text) as { rounds?: Record<string, IRCCRound> }
    )
    return { draws, source: "live" }
  }

  // 1) Local static file (npm run dev — no VERCEL_URL needed)
  const localText = tryReadPublicDrawsFile()
  if (localText) {
    const draws = parseIrccRoundsPayload(
      JSON.parse(localText) as { rounds?: Record<string, IRCCRound> }
    )
    return { draws, source: "static" }
  }

  // 2) Same JSON over HTTPS: DRAWS_JSON_URLS + https://<VERCEL_URL>/draws/ee-rounds.json
  try {
    const text = await firstMirrorJson(3500)
    const draws = parseIrccRoundsPayload(
      JSON.parse(text) as { rounds?: Record<string, IRCCRound> }
    )
    return { draws, source: "static" }
  } catch {
    /* try IRCC */
  }

  // 3) Official IRCC (often slow from datacenters; keep bounded for Hobby)
  try {
    const text = await fetchIrccJsonText(Math.min(irccFetchTimeoutMs(), 6000))
    const draws = parseIrccRoundsPayload(
      JSON.parse(text) as { rounds?: Record<string, IRCCRound> }
    )
    return { draws, source: "live" }
  } catch (error) {
    console.error("IRCC live JSON fetch/parse failed:", error)
  }

  // 4) Bundled (always works, no network)
  console.warn(
    "Using bundled IRCC rounds fallback (update public/draws/ee-rounds.json and src/data/ircc-ee-rounds-fallback.json periodically)"
  )
  const draws = parseIrccRoundsPayload(
    fallbackPayload as { rounds?: Record<string, IRCCRound> }
  )
  return { draws, source: "fallback" }
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
  const { draws } = await scrapeExpressEntryDraws()
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
