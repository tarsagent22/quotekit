import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const { userId } = await auth()

    // Store waitlist entry in Clerk metadata if signed in
    if (userId) {
      try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const existing = (user.privateMetadata?.waitlistEmail as string) || ''
        if (!existing) {
          await client.users.updateUserMetadata(userId, {
            privateMetadata: {
              ...user.privateMetadata,
              waitlistEmail: email,
              waitlistSignedAt: new Date().toISOString(),
            },
          })
        }
      } catch {
        // Non-fatal — still succeed
      }
    }

    // Also append to a flat file for easy access without Clerk dashboard
    try {
      const { appendFile } = await import('fs/promises')
      const { join } = await import('path')
      const logPath = join(process.cwd(), 'waitlist.txt')
      await appendFile(logPath, `${new Date().toISOString()}\t${email}\t${userId || 'guest'}\n`, 'utf8')
    } catch {
      // Non-fatal on Vercel (read-only FS) — Clerk metadata is the source of truth
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ error: err.message || 'Failed to save' }, { status: 500 })
  }
}
