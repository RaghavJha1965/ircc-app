import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { prisma } from "./db"

const JWT_SECRET = new TextEncoder().encode(
  process.env.CRON_SECRET || "fallback-secret-change-me"
)
const COOKIE_NAME = "ircc-session"

export interface SessionUser {
  id: string
  name: string
  email: string
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ userId: user.id, name: user.name, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  return token
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Get or create user's profile, settings, and documents
export async function ensureUserData(userId: string) {
  const profile = await prisma.crsProfile.findUnique({ where: { userId } })
  if (!profile) {
    await prisma.crsProfile.create({ data: { userId } })
  }

  const settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    await prisma.settings.create({
      data: {
        userId,
        emailAddress: user?.email || undefined,
        enableEmail: true,
      },
    })
  }

  const docs = await prisma.document.findMany({ where: { userId } })
  if (docs.length === 0) {
    const defaultDocs = [
      { name: "Valid Passport", category: "identity", description: "Current passport with at least 6 months validity" },
      { name: "Birth Certificate", category: "identity", description: "Original or certified copy" },
      { name: "National ID Card", category: "identity", description: "If applicable to your country" },
      { name: "Degree/Diploma", category: "education", description: "Original certificates from all educational institutions" },
      { name: "Transcripts", category: "education", description: "Official transcripts for all degrees" },
      { name: "ECA Report", category: "education", description: "Educational Credential Assessment from WES or other designated organization" },
      { name: "IELTS/CELPIP Results", category: "language", description: "English language test results (within 2 years)" },
      { name: "TEF/TCF Results", category: "language", description: "French language test results if applicable" },
      { name: "Reference Letters", category: "work", description: "From all employers listed in your application" },
      { name: "Employment Contracts", category: "work", description: "Copies of employment contracts or offer letters" },
      { name: "Pay Stubs", category: "work", description: "Recent pay stubs or salary slips" },
      { name: "Tax Documents", category: "work", description: "T4s, NOAs, or equivalent from your country" },
      { name: "Police Clearance Certificate", category: "police-medical", description: "From each country you lived in for 6+ months" },
      { name: "Medical Exam", category: "police-medical", description: "Immigration Medical Examination (IME)" },
      { name: "Proof of Funds", category: "financial", description: "Bank statements showing settlement funds" },
      { name: "Investment Statements", category: "financial", description: "If using investments as proof of funds" },
    ]
    for (const doc of defaultDocs) {
      await prisma.document.create({ data: { ...doc, userId } })
    }
  }
}
