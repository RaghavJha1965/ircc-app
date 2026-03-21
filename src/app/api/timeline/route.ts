import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checkExpirations } from "@/lib/timeline"

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

    const warnings = checkExpirations({
      ieltsTestDate: profile.ieltsTestDate,
      medicalExamDate: profile.medicalExamDate,
      policeClearanceDate: profile.policeClearanceDate,
      ecaIssueDate: profile.ecaIssueDate,
      irccProfileCreatedDate: profile.irccProfileCreatedDate,
    })

    return NextResponse.json({
      warnings,
      dates: {
        ieltsTestDate: profile.ieltsTestDate,
        medicalExamDate: profile.medicalExamDate,
        policeClearanceDate: profile.policeClearanceDate,
        ecaIssueDate: profile.ecaIssueDate,
        irccProfileCreatedDate: profile.irccProfileCreatedDate,
      },
    })
  } catch (error) {
    console.error("Error checking timeline:", error)
    return NextResponse.json(
      { error: "Failed to check timeline" },
      { status: 500 }
    )
  }
}
