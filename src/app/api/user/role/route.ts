import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const roleSchema = z.object({
  role: z.enum(["BUYER", "SELLER"])
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = roleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid role", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { role } = validation.data

    // Allow setting role only once
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (existing?.role) {
      return NextResponse.json({ error: "Role already set" }, { status: 409 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    )
  }
}
