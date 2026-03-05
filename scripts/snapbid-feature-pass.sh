#!/bin/bash
# snapbid-feature-pass.sh
# Runs a Claude Code feature improvement pass on SnapBid every 6 hours.
# Focuses on the next priority feature: Stripe paywall, email capture, etc.
set -e

REPO="/home/tarsagent/.openclaw/workspace/snapbid"
LOG="/home/tarsagent/.openclaw/workspace/memory/feature-pass-$(date +%Y%m%d-%H%M).log"
export ANTHROPIC_API_KEY="$(grep -A1 '^## Anthropic' /home/tarsagent/.openclaw/workspace/SECRETS.md | tail -1 | awk '{print $NF}' | tr -d '[:space:]')"

echo "=== SnapBid Feature Pass starting at $(date) ===" | tee "$LOG"

cd "$REPO" || exit 1
git pull origin main --quiet

# Determine next priority based on what's already been done
STRIPE_DONE=$(grep -r "stripe" src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | wc -l)

if [ "$STRIPE_DONE" -eq 0 ]; then
  TASK="Implement Stripe paywall for SnapBid. The product is at https://snapbid.app. Stack: Next.js + Tailwind + Clerk auth. 
  Task: Wire up Stripe Checkout so users get 3 free quotes (tracked in their Clerk user metadata), then hit a paywall requiring \$19/mo subscription.
  - Install stripe npm package if not present
  - Create /api/stripe/checkout route that creates a Checkout session
  - Create /api/stripe/webhook route to handle subscription events
  - Add quote_count tracking to Clerk user metadata
  - Show upgrade modal/page when free limit is hit
  - Use test mode keys (hardcode placeholders: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - these will be set as env vars)
  - Make it clean and production-ready
  After making changes: run 'npm run build' to verify no errors, then run './scripts/deploy.sh \"feat: stripe paywall\"'
  
  When completely finished, run: openclaw system event --text 'SnapBid feature pass done: Stripe paywall implemented' --mode now"
else
  TASK="Continue improving SnapBid (https://snapbid.app). Stack: Next.js + Tailwind + Clerk auth + Stripe.
  Review the current codebase and implement the next most impactful improvement:
  1. If email capture for free-tier users is missing, add it
  2. If the onboarding flow needs polish, improve it
  3. If there are missing error states or loading states, add them
  4. If the quote output can be improved (better PDF export, share link, etc.), do it
  Pick ONE thing, implement it fully, build it, and deploy it.
  After changes: run 'npm run build', then './scripts/deploy.sh \"feat: [what you built]\"'
  
  When completely finished, run: openclaw system event --text 'SnapBid feature pass done: [brief summary]' --mode now"
fi

echo "Running Claude Code feature pass..." | tee -a "$LOG"
claude -p "$TASK" --dangerously-skip-permissions 2>&1 | tee -a "$LOG"

echo "=== Feature pass complete at $(date) ===" | tee -a "$LOG"
