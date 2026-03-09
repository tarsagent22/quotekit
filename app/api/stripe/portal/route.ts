import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { currentUser } from '@clerk/nextjs/server'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = user.publicMetadata?.stripe_customer_id as string | undefined
  if (!customerId) {
    return NextResponse.json({ error: 'No Stripe customer found for this account' }, { status: 400 })
  }

  const stripe = getStripe()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: 'https://snapbid.app/',
  })

  return NextResponse.json({ url: session.url })
}
