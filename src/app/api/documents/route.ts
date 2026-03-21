import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession, ensureUserData } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure documents exist for user
    await ensureUserData(session.id)

    const documents = await prisma.document.findMany({
      where: { userId: session.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })

    type Doc = (typeof documents)[number]
    const grouped: Record<string, Doc[]> = {}
    for (const doc of documents) {
      if (!grouped[doc.category]) {
        grouped[doc.category] = []
      }
      grouped[doc.category].push(doc)
    }

    const total = documents.length
    const completed = documents.filter((d: Doc) => d.isCompleted).length
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, category, description, isCompleted, dueDate, notes } = body

    if (id) {
      const document = await prisma.document.update({
        where: { id, userId: session.id },
        data: { name, category, description, isCompleted, dueDate: dueDate ? new Date(dueDate) : null, notes },
      })
      return NextResponse.json({ success: true, document })
    } else {
      const document = await prisma.document.create({
        data: {
          userId: session.id,
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    await prisma.document.delete({ where: { id, userId: session.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    )
  }
}
