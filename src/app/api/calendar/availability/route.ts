import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCalendarAvailability } from "@/lib/google-calendar"
import { z } from "zod"

const availabilitySchema = z.object({
  sellerId: z.string(),
  startTime: z.string(),
  endTime: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")
    const startTime = searchParams.get("startTime")
    const endTime = searchParams.get("endTime")

    const validation = availabilitySchema.safeParse({
      sellerId,
      startTime,
      endTime
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { sellerId: validSellerId, startTime: validStartTime, endTime: validEndTime } = validation.data

    const availability = await getCalendarAvailability(
      validSellerId,
      validStartTime,
      validEndTime
    )

    // Convert busy periods to 30-min free slots helper on client; server returns busy for flexibility
    return NextResponse.json({ busy: availability })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    )
  }
}
