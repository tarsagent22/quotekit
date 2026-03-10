// Server Component — fetches founder count at render time so SSR HTML
// always shows the real "X of 50 claimed" value (fixes Issue #5).
import UpgradeClient from './UpgradeClient'
import Stripe from 'stripe'

const FOUNDER_SPOTS_TOTAL = 50
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min — matches the API route cache

// Module-level cache so cold starts are cheap within the same serverless instance
let cached: { count: number; ts: number } | null = null

async function getFounderSpotsLeft(): Promise<number> {
  // Serve from in-process cache if fresh
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Math.max(0, FOUNDER_SPOTS_TOTAL - cached.count)
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    // Stripe not yet configured — show full spots (honest "just launched" state)
    return FOUNDER_SPOTS_TOTAL
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const FOUNDER_PRICE_ID = 'price_1T8uGlCg7cEQSTg1WqQiUdun'

    let count = 0
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const subs = await stripe.subscriptions.list({
        price: FOUNDER_PRICE_ID,
        status: 'active',
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      count += subs.data.length
      hasMore = subs.has_more
      if (subs.data.length > 0) {
        startingAfter = subs.data[subs.data.length - 1].id
      }
    }

    cached = { count, ts: Date.now() }
    return Math.max(0, FOUNDER_SPOTS_TOTAL - count)
  } catch (err) {
    console.error('[SnapBid] upgrade SSR founder-count error:', err)
    // Fall back to full spots rather than showing 0
    return FOUNDER_SPOTS_TOTAL
  }
}

export default async function UpgradePage() {
  const spotsLeft = await getFounderSpotsLeft()
  return <UpgradeClient initialSpotsLeft={spotsLeft} />
}
