#!/bin/bash
# snapbid-uptime-check.sh
# Checks snapbid.app every 30 minutes. Sends Telegram alert if down.
# Uses openclaw to send the message.

URL="https://snapbid.app"
TIMEOUT=15

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$URL" 2>/dev/null || echo "000")

if [ "$STATUS" != "200" ]; then
  echo "⚠️ snapbid.app is DOWN — HTTP $STATUS at $(date)"
  openclaw system event --text "🚨 SnapBid DOWN: snapbid.app returned HTTP $STATUS at $(date '+%H:%M ET'). Check it!" --mode now
  exit 1
else
  echo "✅ snapbid.app OK (HTTP $STATUS) at $(date)"
  exit 0
fi
