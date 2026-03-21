import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// Default PR document checklist
const DEFAULT_DOCUMENTS = [
  // Identity
  { name: "Valid Passport", category: "identity", description: "Current passport with at least 6 months validity" },
  { name: "Birth Certificate", category: "identity", description: "Original or certified copy" },
  { name: "National ID Card", category: "identity", description: "If applicable to your country" },

  // Education
  { name: "Degree/Diploma", category: "education", description: "Original certificates from all educational institutions" },
  { name: "Transcripts", category: "education", description: "Official transcripts for all degrees" },
  { name: "ECA Report", category: "education", description: "Educational Credential Assessment from WES or other designated organization" },

  // Language
  { name: "IELTS/CELPIP Results", category: "language", description: "English language test results (within 2 years)" },
  { name: "TEF/TCF Results", category: "language", description: "French language test results if applicable" },

  // Work Experience
  { name: "Reference Letters", category: "work", description: "From all employers listed in your application" },
  { name: "Employment Contracts", category: "work", description: "Copies of employment contracts or offer letters" },
  { name: "Pay Stubs", category: "work", description: "Recent pay stubs or salary slips" },
  { name: "Tax Documents", category: "work", description: "T4s, NOAs, or equivalent from your country" },

  // Police & Medical
  { name: "Police Clearance Certificate", category: "police-medical", description: "From each country you lived in for 6+ months" },
  { name: "Medical Exam", category: "police-medical", description: "Immigration Medical Examination (IME)" },

  // Financial
  { name: "Proof of Funds", category: "financial", description: "Bank statements showing settlement funds" },
  { name: "Investment Statements", category: "financial", description: "If using investments as proof of funds" },
]

// GET /api/documents - Get all documents
export async function GET() {
  try {
    let documents = await prisma.document.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })

    // Initialize with default documents if empty
    if (documents.length === 0) {
      for (const doc of DEFAULT_DOCUMENTS) {
        await prisma.document.create({ data: doc })
      }
      documents = await prisma.document.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
      })
    }

    // Group by category
    const grouped = documents.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = []
      }
      acc[doc.category].push(doc)
      return acc
    }, {} as Record<string, typeof documents>)

    // Calculate completion stats
    const total = documents.length
    const completed = documents.filter((d) => d.isCompleted).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      documents,
      grouped,
      stats: { total, completed, percentage },
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create or update a document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, category, description, isCompleted, dueDate, notes } = body

    if (id) {
      // Update existing document
      const document = await prisma.document.update({
        where: { id },
        data: {
          name,
          category,
          description,
          isCompleted,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
        },
      })
      return NextResponse.json({ success: true, document })
    } else {
      // Create new document
      const document = await prisma.document.create({
        data: {
          name,
          category,
          description,
          isCompleted: isCompleted || false,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
        },
      })
      return NextResponse.json({ success: true, document })
    }
  } catch (error) {
    console.error("Error saving document:", error)
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    )
  }
}

// DELETE /api/documents - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    await prisma.document.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    )
  }
}
