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

### [UX NOTE] #5 — Upgrade page progress bar shows "0 of 50 claimed" on initial SSR render
**Detected:** 2026-03-10  
**Status:** Open  
**Severity:** Low (cosmetic / FOMO signal loss)  
**Confirmed live:** 2026-03-10 03:10 AM ET (web fetch of https://snapbid.app/upgrade)

**Problem:** The upgrade page SSR renders "0 of 50 spots claimed / 50 left" because `spotsLeft` initializes to `null` (displayed as `FOUNDER_SPOTS_TOTAL = 50` via `displaySpotsLeft = spotsLeft ?? 50`). The real count loads via `useEffect` after hydration. The raw HTML served to scrapers/bots/slow connections always shows 0 claimed.

**Impact:** Minor trust/FOMO signal loss. Any user on a slow connection or any search bot sees "0 of 50 claimed," defeating the urgency messaging. If Chandler is running any paid ads pointing to `/upgrade`, this matters.

**Fix (optional):** Fetch founder count in a Server Component and pass as a prop, or accept the flash since the `/api/founder-count` call is typically fast after hydration.

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
