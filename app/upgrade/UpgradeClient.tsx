'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const FOUNDER_SPOTS_TOTAL = 50

const FEATURES = [
  { label: 'Unlimited quotes — no monthly cap' },
  { label: 'Professional branded PDF exports' },
  { label: 'Calibrated to your exact rates and trade' },
  { label: 'Quote history and win/loss tracking' },
  { label: 'One-click email and share to clients' },
  { label: 'All future features included' },
]

interface Props {
  initialSpotsLeft: number
}

export default function UpgradeClient({ initialSpotsLeft }: Props) {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState<'ltd' | 'monthly' | null>(null)
  const [error, setError] = useState('')
  const [spotsLeft, setSpotsLeft] = useState<number>(initialSpotsLeft)
  const [ltdAvailable, setLtdAvailable] = useState<boolean>(!!process.env.NEXT_PUBLIC_LTD_ENABLED)

  useEffect(() => {
    fetch('/api/founder-count')
      .then(r => r.json())
      .then(d => {
        if (d.count !== null && d.count !== undefined) {
          setSpotsLeft(Math.max(0, FOUNDER_SPOTS_TOTAL - d.count))
        }
      })
      .catch(() => {})

    // Check if LTD is configured
    fetch('/api/stripe/checkout?type=ltd&check=true')
      .then(r => { if (r.status !== 500) setLtdAvailable(true) })
      .catch(() => {})
  }, [])

  const handleCheckout = async (type: 'ltd' | 'monthly') => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    setLoading(type)
    setError('')
    try {
      const url = type === 'ltd'
        ? '/api/stripe/checkout?type=ltd'
        : '/api/stripe/checkout'
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  const spotsClaimed = FOUNDER_SPOTS_TOTAL - spotsLeft
  const spotsPercent = Math.round((spotsClaimed / FOUNDER_SPOTS_TOTAL) * 100)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="bg-[#faf8f5] border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2.5">
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="SnapBid" className="h-9 w-auto" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Headline */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">Early Access</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
            Quote faster. Close more jobs.
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto">
            SnapBid Pro gives you unlimited AI-powered quotes, professional PDFs, and full history — built for working contractors.
          </p>
        </div>

        {/* LTD card — PRIMARY */}
        {ltdAvailable && (
          <div className="bg-[#faf8f5] rounded-2xl border-2 border-[#991b1b] shadow-lg overflow-hidden mb-4">
            <div className="bg-[#991b1b] px-8 py-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-200">Best Value</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-4xl font-bold text-white">$59</span>
                  <span className="text-white/70 text-base font-medium">one-time</span>
                </div>
                <p className="text-amber-100 text-sm mt-1">Pay once. Use forever.</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs line-through">$9/mo × 12 = $108/yr</p>
                <p className="text-amber-200 text-sm font-semibold mt-0.5">Save 45%+ vs monthly</p>
              </div>
            </div>

            <div className="px-8 py-6">
              <ul className="space-y-3 mb-6">
                {FEATURES.map(f => (
                  <li key={f.label} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#991b1b] flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{f.label}</span>
                  </li>
                ))}
                <li className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-amber-700">Early access — limited time offer</span>
                </li>
              </ul>

              <button
                onClick={() => handleCheckout('ltd')}
                disabled={!!loading || !isLoaded}
                className="w-full bg-[#991b1b] hover:bg-red-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2 shadow-sm"
              >
                {loading === 'ltd' ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirecting to checkout...</>
                ) : (
                  user ? 'Get Lifetime Access — $59' : 'Sign in to get started'
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">Secured by Stripe · One-time payment · No subscription</p>
            </div>
          </div>
        )}

        {/* Monthly card — SECONDARY */}
        <div className={`bg-[#faf8f5] rounded-2xl border ${ltdAvailable ? 'border-gray-200' : 'border-2 border-[#991b1b] shadow-lg'} overflow-hidden mb-6`}>
          {!ltdAvailable && (
            <div className="bg-[#991b1b] px-8 py-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-200">Founder Pricing</span>
            </div>
          )}
          <div className="px-8 py-6">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">$9</span>
              <span className="text-gray-500 text-base">/month</span>
              {!ltdAvailable && <span className="text-xs text-gray-400 ml-2 line-through">$19/mo after {FOUNDER_SPOTS_TOTAL} founders</span>}
            </div>
            <p className="text-gray-500 text-sm mb-5">Cancel anytime. Price locked in for you forever.</p>

            {/* Spots bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{spotsClaimed} of {FOUNDER_SPOTS_TOTAL} founder spots claimed</span>
                <span className="text-[#991b1b] font-medium">{spotsLeft} left</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-[#991b1b] h-1.5 rounded-full transition-all" style={{ width: `${Math.max(4, spotsPercent)}%` }} />
              </div>
            </div>

            <button
              onClick={() => handleCheckout('monthly')}
              disabled={!!loading || !isLoaded}
              className={`w-full disabled:opacity-60 font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 ${
                ltdAvailable
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  : 'bg-[#991b1b] hover:bg-red-800 text-white shadow-sm'
              }`}
            >
              {loading === 'monthly' ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Redirecting...</>
              ) : (
                ltdAvailable ? 'Or subscribe monthly — $9/mo' : (user ? `Claim Founder Spot — $9/mo` : 'Sign in to get started')
              )}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

        <div className="text-center">
          <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Back to SnapBid
          </button>
        </div>
      </div>
    </div>
  )
}
