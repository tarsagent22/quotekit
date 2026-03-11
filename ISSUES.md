# SnapBid — Known Issues

## Open Issues

---

### ✅ [BUG] #1 — AI overrides quoteNumber format
**Detected:** 2026-03-10  
**Status:** Resolved — 2026-03-10 05:05 AM ET  
**Severity:** Medium  
**File:** `app/api/generate-quote/route.ts`

**Problem:** The server generates a canonical `SB-XXXX` quote number (`quoteNum`) and embeds it in the AI prompt, but after parsing the AI response, `quoteData.quoteNumber` is used directly without being overridden. The AI occasionally ignores the instructed format and returns its own (e.g., `TC-2025-001` based on business name initials).

**Evidence:** Calling the API with `businessName: "Test Co"` returned `"quoteNumber": "TC-2025-001"` instead of the expected `SB-XXXX` format.

**Impact:** Inconsistent quote numbers in history, PDF exports, and email subjects. Confuses contractors who expect `SB-` prefix.

**Fix applied:** Added `quoteData.quoteNumber = quoteNum` immediately after `JSON.parse(cleaned)` — unconditionally overrides any AI-returned quote number with the server-generated `SB-XXXX` value.

---

### ✅ [UX] #6 — Intro Message profile field missing from UI (silent feature gap)
**Detected:** 2026-03-11  
**Status:** Resolved — 2026-03-11 05:15 AM ET (commit `525b7dc`)  
**Severity:** Medium (feature silently unusable)

**Problem:** `introMessage` was defined in `ContractorProfile`, saved/loaded by the API, and used by the AI in quote generation. But there was no input field in `app/profile/page.tsx` — contractors had no way to set it through the UI.

**Fix applied:** Added "Intro Message" textarea to Quote Settings section in the profile page. Includes placeholder text and helper description.

---

### ✅ [UX] #7 — Access difficulty chip colors ambiguous
**Detected:** 2026-03-11  
**Status:** Resolved — 2026-03-11 05:15 AM ET (commit `525b7dc`)  
**Severity:** Low (cosmetic)

**Problem:** Easy, Moderate, and Difficult access difficulty buttons all used `bg-amber-600` when selected — Easy and Moderate were indistinguishable.

**Fix applied:** Easy = `bg-emerald-600` (green), Moderate = `bg-amber-600` (amber), Difficult = `bg-red-500` (red).

---

### [WARNING] #4 — Clerk publishable key has trailing newline in env var
**Detected:** 2026-03-10  
**Status:** Open  
**Severity:** Low (auth appears functional, but should be cleaned up)  
**File:** Vercel environment variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

**Problem:** The Clerk publishable key in the Vercel env var has a trailing `\n` (newline character). This is visible in the SSR HTML as `"pk_test_...dZXYk\n"`. Clerk likely strips this before use, so auth seems to work, but it's sloppy and matches the known failure pattern from `TOOLS.md` (Secrets Hygiene).

**Also:** The key is `pk_test_` (development mode). If this is intended for production use, a `pk_live_` key from a production Clerk instance should be used instead.

**Fix:**
1. Go to Vercel → Project → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — strip any trailing whitespace/newline
3. Consider upgrading to a production Clerk instance (`pk_live_`) before launch

---

### ✅ [UX NOTE] #5 — Upgrade page progress bar shows "0 of 50 claimed" on initial SSR render
**Detected:** 2026-03-10  
**Status:** Resolved — 2026-03-10 (commit `b507e09`)
**Severity:** Low (cosmetic / FOMO signal loss)  
**Confirmed live:** 2026-03-10 03:10 AM ET (web fetch of https://snapbid.app/upgrade)

**Fix applied:** Converted `/upgrade/page.tsx` to a proper async Server Component that fetches the Stripe active subscription count at render time and passes `initialSpotsLeft` as a prop to `UpgradeClient`. SSR now shows real spot count; client re-fetches `/api/founder-count` in useEffect for freshness.

---

## Resolved Issues

---

### ✅ [BUG] #2 — /sign-up returns 404; /dashboard returns 404
**Detected:** 2026-03-09 19:09 ET  
**Resolved:** 2026-03-09 23:05 ET (commit `eee13d4`)  

**Fix applied:** Created `/app/sign-up/[[...sign-up]]/page.tsx` with `<SignUp />` component (mirrors sign-in pattern, redirects to `/profile` post-auth). Added `/sign-up(.*)` to public routes in middleware. `/dashboard` 404 is acceptable — app uses `/profile` as the post-login destination.

---

### ✅ [UX] #3 — Upgrade page progress bar label contradicted bar fill
**Detected:** 2026-03-09 19:09 ET  
**Resolved:** 2026-03-09 23:05 ET (commit `eee13d4`)  

**Fix applied:** Fixed label to read "X of 50 spots claimed / Y left" so bar fill and text consistently describe spots *taken*, eliminating the contradiction.
