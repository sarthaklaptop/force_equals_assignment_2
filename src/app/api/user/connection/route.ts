import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface SessionUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role?: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('sellerId')
  if (sellerId) {
    const tokens = await prisma.refreshToken.findMany({ where: { userId: sellerId } })
    return NextResponse.json({ connected: tokens.length > 0 })
  }
  const session = await getServerSession(authOptions)
  if (!(session?.user as SessionUser)?.id) return NextResponse.json({ connected: false })
  const tokens = await prisma.refreshToken.findMany({ where: { userId: (session?.user as SessionUser).id } })
  return NextResponse.json({ connected: tokens.length > 0 })
}


