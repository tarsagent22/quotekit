# SnapBid Issues

## Open Issues

_(none)_

---

## Resolved Issues

### ISSUE-001 — `/profile` returns 404 for unauthenticated users
**Severity:** Medium  
**Found:** 2026-03-09 03:09 AM ET  
**Resolved:** 2026-03-09 (commit `5d0398c`)  
**Fix:** Middleware marks `/profile` as a public route, allowing unauthenticated access. Profile page handles unauth state gracefully. Footer nav link is gated to signed-in users only via `userId &&` check in `layout.tsx`.

---

### ISSUE-002 — `/api/founder-count` returns 404 → progress bar broken on upgrade page
**Severity:** High  
**Found:** 2026-03-09 03:09 AM ET  
**Resolved:** 2026-03-09 (commit `5d0398c`)  
**Fix:** Created `/app/api/founder-count/route.ts` with Stripe subscriber count + 5-min cache. Upgrade page fetches live count and shows correct spots-remaining bar. Falls back to FOUNDER_SPOTS_TOTAL (50) if Stripe isn't configured.

---

### ISSUE-003 — Clerk publishable key has trailing newline in HTML output
**Severity:** Low  
**Found:** 2026-03-09 03:09 AM ET  
**Resolved:** 2026-03-09 (commit `5d0398c`)  
**Fix:** Vercel env var trimmed. Clerk SDK confirmed unaffected.

---
