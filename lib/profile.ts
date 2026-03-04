/**
 * Profile storage via Clerk private metadata.
 *
 * Profiles are stored as `privateMetadata.contractorProfile` on the Clerk user
 * object. This means:
 *  - Data persists permanently — tied to the user's email/auth account
 *  - Survives all Vercel deploys, cold starts, and function restarts
 *  - No external database required
 *  - Data is never exposed to the browser (private metadata is server-only)
 */

import { clerkClient } from '@clerk/nextjs/server'

export interface ContractorProfile {
  userId: string
  businessName: string
  trade: string
  hourlyRate: number
  region: string
  materialTier: 'budget' | 'standard' | 'premium'
  crewSize: number
  markup: number           // percentage e.g. 20 = 20%
  quoteCount: number
  createdAt: string
  updatedAt: string
  // Extended profile fields
  phone?: string
  email?: string
  businessAddress?: string
  licenseNumber?: string
  yearsInBusiness?: string
  specialties?: string     // comma-separated
  taxRate?: number         // percentage e.g. 8.5
  paymentTerms?: string    // e.g. '50-deposit', 'net-30'
  quoteValidityDays?: number
  introMessage?: string
}

export async function getProfile(userId: string): Promise<ContractorProfile | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const profile = user.privateMetadata?.contractorProfile as ContractorProfile | undefined
    return profile ?? null
  } catch {
    return null
  }
}

export async function saveProfile(profile: ContractorProfile): Promise<void> {
  profile.updatedAt = new Date().toISOString()
  const client = await clerkClient()
  await client.users.updateUserMetadata(profile.userId, {
    privateMetadata: {
      contractorProfile: profile,
    },
  })
}

export async function incrementQuoteCount(userId: string): Promise<number> {
  const profile = await getProfile(userId)
  if (!profile) return 0
  profile.quoteCount = (profile.quoteCount || 0) + 1
  await saveProfile(profile)
  return profile.quoteCount
}
