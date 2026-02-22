import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/server/auth"

export async function GET() {
  try {
    const userId = await getUserId()

    const synchronizations = await prisma.synchronization.findMany({
      where: {
        userId,
        service: "schwab",
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: synchronizations })
  } catch (error) {
    console.error("[Schwab Synchronizations] GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch synchronizations" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId()
    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      )
    }

    await prisma.synchronization.deleteMany({
      where: {
        userId,
        service: "schwab",
        accountId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Schwab Synchronizations] DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete synchronization" },
      { status: 500 }
    )
  }
}
