import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { calculateCRS, type CrsProfile } from "@/lib/crs-calculator"
import { checkEligibility } from "@/lib/program-eligibility"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    let profile = await prisma.crsProfile.findUnique({
      where: { id: "default" },
    })

    if (!profile) {
      profile = await prisma.crsProfile.create({
        data: { id: "default" },
      })
    }

    const firstLanguageScores = JSON.parse(profile.firstLanguageScores || '{"reading":6,"writing":6,"listening":6,"speaking":6}')
    const secondLanguageScores = profile.secondLanguageScores ? JSON.parse(profile.secondLanguageScores) : undefined
    const spouseLanguageScores = profile.spouseLanguageScores ? JSON.parse(profile.spouseLanguageScores) : undefined
    const preferredProvinces = profile.preferredProvinces ? JSON.parse(profile.preferredProvinces) : undefined

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
    const results = checkEligibility(
      crsProfile,
      profile.nocCode || undefined,
      profile.nocTeerCategory || undefined,
      preferredProvinces
    )

    return NextResponse.json({
      results,
      totalScore: breakdown.total,
      nocCode: profile.nocCode,
      nocTeerCategory: profile.nocTeerCategory,
      preferredProvinces,
    })
  } catch (error) {
    console.error("Error checking eligibility:", error)
    return NextResponse.json(
      { error: "Failed to check eligibility" },
      { status: 500 }
    )
  }
}
