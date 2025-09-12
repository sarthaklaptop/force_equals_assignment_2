import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all" // "upcoming", "past", "all"

    const whereClause: any = {
      OR: [
        { sellerId: session.user.id },
        { buyerId: session.user.id }
      ]
    }

    if (type === "upcoming") {
      whereClause.startTime = {
        gte: new Date()
      }
    } else if (type === "past") {
      whereClause.startTime = {
        lt: new Date()
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        startTime: "asc"
      }
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}
