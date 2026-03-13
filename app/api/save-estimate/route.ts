import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory store for guest email captures (session-scoped)
// In production, this would write to a DB
const guestEmailCaptures: Array<{
  email: string
  capturedAt: string
  estimateRef?: string
}> = []

export async function POST(req: NextRequest) {
  try {
    const { email, estimateRef } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    // Store locally (extend to DB write here later)
    guestEmailCaptures.push({
      email,
      capturedAt: new Date().toISOString(),
      estimateRef: estimateRef || undefined,
    })
    console.log(`[save-estimate] Captured guest email: ${email}, estimate: ${estimateRef}`)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
