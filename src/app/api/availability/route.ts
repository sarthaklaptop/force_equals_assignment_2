import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const upsertSchema = z.object({
  slots: z.array(z.object({
    weekday: z.number().min(0).max(6),
    startMin: z.number().min(0).max(24*60-1),
    endMin: z.number().min(1).max(24*60)
  })).max(100)
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('sellerId')
  if (!sellerId) return NextResponse.json({ error: 'sellerId required' }, { status: 400 })
  const slots = await prisma.sellerAvailability.findMany({
    where: { userId: sellerId, active: true },
    orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }]
  })
  return NextResponse.json({ slots })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })

  // Replace existing active slots
  await prisma.$transaction([
    prisma.sellerAvailability.deleteMany({ where: { userId: session.user.id } }),
    prisma.sellerAvailability.createMany({ data: parsed.data.slots.map(s => ({ ...s, userId: session.user.id, active: true })) })
  ])
  return NextResponse.json({ ok: true })
}



