import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProfile, saveProfile } from '@/lib/profile'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { logoDataUrl } = await req.json()

  // Basic validation — must be a data URL image
  if (logoDataUrl && !logoDataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
  }

  // Clerk metadata has a ~8KB limit per key — resize is handled client-side
  // Rough check: base64 of 150KB image ≈ 200KB string — too large for metadata
  if (logoDataUrl && logoDataUrl.length > 150_000) {
    return NextResponse.json({ error: 'Logo too large. Please use an image under 100KB.' }, { status: 400 })
  }

  const profile = await getProfile(userId)
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  profile.logoDataUrl = logoDataUrl || undefined
  await saveProfile(profile)

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getProfile(userId)
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  delete profile.logoDataUrl
  await saveProfile(profile)

  return NextResponse.json({ ok: true })
}
