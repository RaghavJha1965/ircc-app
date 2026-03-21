import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { calculateCRS, type CrsProfile } from "@/lib/crs-calculator"
import { generateRecommendations } from "@/lib/recommendations"

export const dynamic = "force-dynamic"

// GET /api/crs-profile - Get saved CRS profile and calculate score
export async function GET() {
  try {
    let profile = await prisma.crsProfile.findUnique({
      where: { id: "default" },
    })

    if (!profile) {
      // Create default profile
      profile = await prisma.crsProfile.create({
        data: { id: "default" },
      })
    }

    // Parse JSON fields
    const firstLanguageScores = JSON.parse(profile.firstLanguageScores || '{"reading":6,"writing":6,"listening":6,"speaking":6}')
    const secondLanguageScores = profile.secondLanguageScores ? JSON.parse(profile.secondLanguageScores) : undefined
    const spouseLanguageScores = profile.spouseLanguageScores ? JSON.parse(profile.spouseLanguageScores) : undefined

    // Build CRS profile object
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

    // Calculate CRS score
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

// POST /api/crs-profile - Save CRS profile
export async function POST(request: NextRequest) {
  try {
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
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        ...updateData,
      },
    })

    // Calculate new score
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
