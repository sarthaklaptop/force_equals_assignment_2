import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createCalendarEvent } from "@/lib/google-calendar"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

interface SessionUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role?: string | null
}

const bookingSchema = z.object({
  sellerId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  title: z.string().optional(),
  description: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = bookingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { sellerId, startTime, endTime, title, description } = validation.data

    // Check if seller exists and has refresh token (connected calendar)
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: { refreshTokens: true }
    })

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      )
    }

    if (!seller.refreshTokens.length) {
      // Double-check via API param for debugging and client-side checks
      return NextResponse.json(
        { error: "Seller not connected to Google Calendar" },
        { status: 409 }
      )
    }

    // Create calendar event
    const event = await createCalendarEvent(
      sellerId,
      (session.user as SessionUser).id,
      startTime,
      endTime,
      title || "Scheduled Meeting",
      description
    )

    // Save appointment to database
    const appointment = await prisma.appointment.create({
      data: {
        sellerId,
        buyerId: (session.user as SessionUser).id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        googleEventId: event.id || undefined,
        title: title || "Scheduled Meeting",
        description
      }
    })

    return NextResponse.json({ 
      appointment,
      event: {
        id: event.id,
        htmlLink: event.htmlLink
      }
    })
  } catch (error) {
    console.error("Error booking appointment:", error)
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    )
  }
}
