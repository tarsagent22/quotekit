import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
let cached: { count: number; ts: number } | null = null

/**
 * Counts completed LTD purchases by paginating checkout.sessions with
 * status='complete' and filtering for mode=payment + metadata.ltd='true'.
 *
 * Replaces the old subscriptions.list() approach which was broken because
 * LTD uses mode:'payment' (one-time charge), not mode:'subscription'.
 * Issue #16.
 */
async function countLTDPurchases(stripe: Stripe): Promise<number> {
  let count = 0
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      status: 'complete',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    // Filter to LTD sessions only (mode=payment + metadata.ltd='true')
    for (const session of sessions.data) {
      if (session.mode === 'payment' && session.metadata?.ltd === 'true') {
        count++
      }
    }

    hasMore = sessions.has_more
    if (sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id
    }
  }

  return count
}

export async function GET() {
  // Serve from cache if fresh
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ count: cached.count }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }
    })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    // Return null so the UI knows Stripe isn't configured yet (vs. genuinely 0 purchases)
    return NextResponse.json({ count: null })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const count = await countLTDPurchases(stripe)

    cached = { count, ts: Date.now() }
    return NextResponse.json({ count }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }
    })
  } catch (err) {
    console.error('[SnapBid] founder-count error:', err)
    return NextResponse.json({ count: 0 })
  }
}
