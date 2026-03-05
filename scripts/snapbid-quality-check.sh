#!/bin/bash
# snapbid-quality-check.sh
# Full visual + functional quality review of SnapBid every 4 hours.
# Takes screenshots, evaluates UI/UX, makes improvements, deploys.
set -e

REPO="/home/tarsagent/.openclaw/workspace/snapbid"
LOG="/home/tarsagent/.openclaw/workspace/memory/quality-check-$(date +%Y%m%d-%H%M).log"
SCREENSHOTS_DIR="/home/tarsagent/.openclaw/workspace/memory/screenshots"
export ANTHROPIC_API_KEY="$(grep -A1 '^## Anthropic' /home/tarsagent/.openclaw/workspace/SECRETS.md | tail -1 | awk '{print $NF}' | tr -d '[:space:]')"

mkdir -p "$SCREENSHOTS_DIR"
echo "=== SnapBid Quality Check starting at $(date) ===" | tee "$LOG"

cd "$REPO" || exit 1
git pull origin main --quiet

TASK="You are doing a full quality review and improvement pass for SnapBid (https://snapbid.app).

STEP 1 - VISUAL INSPECTION:
Use the browser tool to:
1. Take a screenshot of https://snapbid.app (homepage)
2. Navigate to the quote generator and take a screenshot
3. Check the mobile view (resize to 375px wide) and screenshot
4. Look at the sign-in flow

STEP 2 - EVALUATE (think critically about each):
- Color scheme: Is it professional? Consistent? On-brand for contractors?
- Typography: Readable? Hierarchy clear?
- Layout/spacing: Feels cramped or balanced?
- CTAs: Are they prominent and clear?
- Mobile experience: Does it work well on phone?
- Loading states: Are there spinners/skeletons where needed?
- Error states: What happens if the AI call fails?
- Copy/messaging: Is it compelling for solo contractors?
- Feature gaps: Anything obviously missing that would help convert?
- Broken functionality: Test the quote generator with a sample job description

STEP 3 - PRIORITIZE:
Pick the 1-3 most impactful improvements. Think ROI: what would most help convert a visitor to a paying user?

STEP 4 - IMPLEMENT:
Make the improvements directly in the codebase at $REPO.
- Edit files as needed
- Run 'npm run build' to verify no build errors
- Fix any build errors before deploying

STEP 5 - DEPLOY:
Run: cd $REPO && ./scripts/deploy.sh 'improvement: [brief description of what changed]'

STEP 6 - VERIFY:
After deploy, take a final screenshot to confirm the improvements look right.

When completely finished, run: openclaw system event --text 'SnapBid quality pass done: [1-sentence summary of what changed]' --mode now"

echo "Running Claude Code quality pass..." | tee -a "$LOG"
claude -p "$TASK" --dangerously-skip-permissions 2>&1 | tee -a "$LOG"

echo "=== Quality check complete at $(date) ===" | tee -a "$LOG"
