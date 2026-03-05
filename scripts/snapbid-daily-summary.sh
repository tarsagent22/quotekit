#!/bin/bash
# snapbid-daily-summary.sh
# Sends Chandler a daily status summary at 8 AM via Telegram.
# Includes: what was built, git log, site status, next priorities.

REPO="/home/tarsagent/.openclaw/workspace/snapbid"
MEMORY_DIR="/home/tarsagent/.openclaw/workspace/memory"

# Check site status
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://snapbid.app" 2>/dev/null || echo "000")
SITE_STATUS="✅ Live (HTTP $STATUS)"
[ "$STATUS" != "200" ] && SITE_STATUS="🚨 DOWN (HTTP $STATUS)"

# Get recent git commits (last 24h)
cd "$REPO" || exit 1
COMMITS=$(git log --oneline --since="24 hours ago" 2>/dev/null | head -10 || echo "No commits in last 24h")

# Count log files from overnight
QUALITY_LOGS=$(ls "$MEMORY_DIR"/quality-check-*.log 2>/dev/null | wc -l)
FEATURE_LOGS=$(ls "$MEMORY_DIR"/feature-pass-*.log 2>/dev/null | wc -l)

# Build summary message
SUMMARY="📊 *SnapBid Daily Summary* — $(date '+%a %b %d, %I:%M %p ET')

*Site:* $SITE_STATUS
*URL:* https://snapbid.app

*Commits (last 24h):*
${COMMITS:-No new commits}

*Automated passes run:*
• Quality checks: $QUALITY_LOGS logs found
• Feature passes: $FEATURE_LOGS logs found

*Quick check links:*
• https://snapbid.app
• https://vercel.com/tarsagent22/snapbid

Rove is on it. 🦾"

echo "$SUMMARY"

# Send via openclaw
openclaw system event --text "$SUMMARY" --mode now
