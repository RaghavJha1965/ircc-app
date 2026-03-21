import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { calculateCRS, type CrsProfile } from "@/lib/crs-calculator"
import { generateRecommendations } from "@/lib/recommendations"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

function buildCrsProfile(profile: {
  age: number
  educationLevel: string
  firstLanguageScores: string
  secondLanguageScores: string | null
  canadianWorkYears: number
  foreignWorkYears: number
  hasSpouse: boolean
  spouseEducation: string | null
  spouseLanguageScores: string | null
  spouseCanadianWork: number
  provincialNomination: boolean
  jobOffer: string | null
  canadianEducation: string | null
  frenchAbility: string | null
  sibling: boolean
}) {
  const firstLanguageScores = JSON.parse(profile.firstLanguageScores || '{"reading":6,"writing":6,"listening":6,"speaking":6}')
  const secondLanguageScores = profile.secondLanguageScores ? JSON.parse(profile.secondLanguageScores) : undefined
  const spouseLanguageScores = profile.spouseLanguageScores ? JSON.parse(profile.spouseLanguageScores) : undefined

  const crsProfile: CrsProfile = {
    age: profile.age,
    educationLevel: profile.educationLevel,
    firstLanguageScores,
    secondLanguageScores,
    canadianWorkYears: profile.canadianWorkYears,
    foreignWorkYears: profile.foreignWorkYears,
    hasSpouse: profile.hasSpouse,
    spouseEducation: profile.spouseEducation || undefined,
    spouseLanguageScores,
    spouseCanadianWork: profile.spouseCanadianWork,
    provincialNomination: profile.provincialNomination,
    jobOffer: profile.jobOffer || undefined,
    canadianEducation: profile.canadianEducation || undefined,
    frenchAbility: profile.frenchAbility || undefined,
    sibling: profile.sibling,
  }

  return { crsProfile, firstLanguageScores, secondLanguageScores, spouseLanguageScores }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let profile = await prisma.crsProfile.findUnique({
      where: { userId: session.id },
    })

    if (!profile) {
      profile = await prisma.crsProfile.create({
        data: { userId: session.id },
      })
    }

    const { crsProfile, firstLanguageScores, secondLanguageScores, spouseLanguageScores } = buildCrsProfile(profile)
    const breakdown = calculateCRS(crsProfile)
    const recommendations = generateRecommendations(crsProfile, breakdown)

    return NextResponse.json({
      profile: {
        ...profile,
        firstLanguageScores,
        secondLanguageScores,
        spouseLanguageScores,
        preferredProvinces: profile.preferredProvinces ? JSON.parse(profile.preferredProvinces) : [],
      },
      breakdown,
      totalScore: breakdown.total,
      recommendations,
    })
  } catch (error) {
    console.error("Error fetching CRS profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch CRS profile" },
      { status: 500 }
    )
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

    if (body.age !== undefined) updateData.age = body.age
    if (body.educationLevel !== undefined) updateData.educationLevel = body.educationLevel
    if (body.firstLanguageTest !== undefined) updateData.firstLanguageTest = body.firstLanguageTest
    if (body.firstLanguageScores !== undefined) {
      updateData.firstLanguageScores = JSON.stringify(body.firstLanguageScores)
    }
    if (body.secondLanguageScores !== undefined) {
      updateData.secondLanguageScores = body.secondLanguageScores ? JSON.stringify(body.secondLanguageScores) : null
    }
    if (body.canadianWorkYears !== undefined) updateData.canadianWorkYears = body.canadianWorkYears
    if (body.foreignWorkYears !== undefined) updateData.foreignWorkYears = body.foreignWorkYears
    if (body.hasSpouse !== undefined) updateData.hasSpouse = body.hasSpouse
    if (body.spouseEducation !== undefined) updateData.spouseEducation = body.spouseEducation
    if (body.spouseLanguageScores !== undefined) {
      updateData.spouseLanguageScores = body.spouseLanguageScores ? JSON.stringify(body.spouseLanguageScores) : null
    }
    if (body.spouseCanadianWork !== undefined) updateData.spouseCanadianWork = body.spouseCanadianWork
    if (body.provincialNomination !== undefined) updateData.provincialNomination = body.provincialNomination
    if (body.jobOffer !== undefined) updateData.jobOffer = body.jobOffer
    if (body.canadianEducation !== undefined) updateData.canadianEducation = body.canadianEducation
    if (body.frenchAbility !== undefined) updateData.frenchAbility = body.frenchAbility
    if (body.sibling !== undefined) updateData.sibling = body.sibling
    if (body.nocCode !== undefined) updateData.nocCode = body.nocCode || null
    if (body.nocTeerCategory !== undefined) updateData.nocTeerCategory = body.nocTeerCategory || null
    if (body.preferredProvinces !== undefined) {
      updateData.preferredProvinces = body.preferredProvinces ? JSON.stringify(body.preferredProvinces) : null
    }
    if (body.ieltsTestDate !== undefined) updateData.ieltsTestDate = body.ieltsTestDate ? new Date(body.ieltsTestDate) : null
    if (body.medicalExamDate !== undefined) updateData.medicalExamDate = body.medicalExamDate ? new Date(body.medicalExamDate) : null
    if (body.policeClearanceDate !== undefined) updateData.policeClearanceDate = body.policeClearanceDate ? new Date(body.policeClearanceDate) : null
    if (body.ecaIssueDate !== undefined) updateData.ecaIssueDate = body.ecaIssueDate ? new Date(body.ecaIssueDate) : null
    if (body.irccProfileCreatedDate !== undefined) updateData.irccProfileCreatedDate = body.irccProfileCreatedDate ? new Date(body.irccProfileCreatedDate) : null

    const profile = await prisma.crsProfile.upsert({
      where: { userId: session.id },
      update: updateData,
      create: {
        userId: session.id,
        ...updateData,
      },
    })

    const { crsProfile } = buildCrsProfile(profile)
    const breakdown = calculateCRS(crsProfile)

    return NextResponse.json({
      success: true,
      totalScore: breakdown.total,
      breakdown,
    })
  } catch (error) {
    console.error("Error saving CRS profile:", error)
    return NextResponse.json(
      { error: "Failed to save CRS profile" },
      { status: 500 }
    )
  }
}
