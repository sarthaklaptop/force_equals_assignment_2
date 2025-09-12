import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('sellerId')
  if (sellerId) {
    const tokens = await prisma.refreshToken.findMany({ where: { userId: sellerId } })
    return NextResponse.json({ connected: tokens.length > 0 })
  }
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ connected: false })
  const tokens = await prisma.refreshToken.findMany({ where: { userId: session.user.id } })
  return NextResponse.json({ connected: tokens.length > 0 })
}


