#!/usr/bin/env bash
# cron-publish-next.sh
# Reads the next unpublished post from content/blog/queue.md,
# writes + publishes it using publish-blog-post.sh, then marks it done.
# Called by OpenClaw cron jobs. Includes jitter to avoid bot-like timing.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QUEUE_FILE="$REPO_DIR/content/blog/queue.md"
LOG_FILE="/home/tarsagent/.openclaw/workspace/memory/blog-cron.log"
SKILL_DIR="/home/tarsagent/.openclaw/workspace/skills/blog-seo-production"

# ── Jitter: random delay 0–25 minutes ──────────────────────────────────────
JITTER=$(( RANDOM % 1500 ))
echo "[$(date)] Jitter sleep: ${JITTER}s" >> "$LOG_FILE"
sleep "$JITTER"

# ── Read next queued item ──────────────────────────────────────────────────
NEXT_LINE=$(grep -m1 '^\- \[ \]' "$QUEUE_FILE" || true)

if [[ -z "$NEXT_LINE" ]]; then
  echo "[$(date)] Queue empty — nothing to publish." >> "$LOG_FILE"
  exit 0
fi

# Parse: - [ ] slug | title | structure | notes
SLUG=$(echo "$NEXT_LINE" | sed 's/^- \[ \] //' | cut -d'|' -f1 | xargs)
TITLE=$(echo "$NEXT_LINE" | cut -d'|' -f2 | xargs)
STRUCTURE=$(echo "$NEXT_LINE" | cut -d'|' -f3 | xargs)
NOTES=$(echo "$NEXT_LINE" | cut -d'|' -f4 | xargs)

echo "[$(date)] Publishing: $TITLE (slug: $SLUG, structure: $STRUCTURE)" >> "$LOG_FILE"

# ── Derive project type from slug ──────────────────────────────────────────
if echo "$SLUG" | grep -q 'kitchen'; then PROJECT_TYPE="kitchen"
elif echo "$SLUG" | grep -q 'bathroom'; then PROJECT_TYPE="bathroom"
elif echo "$SLUG" | grep -q 'roof'; then PROJECT_TYPE="roofing"
elif echo "$SLUG" | grep -q 'hvac\|heat\|furnace\|ac\|air'; then PROJECT_TYPE="hvac"
elif echo "$SLUG" | grep -q 'deck\|patio'; then PROJECT_TYPE="deck"
elif echo "$SLUG" | grep -q 'window'; then PROJECT_TYPE="windows"
else PROJECT_TYPE="general"
fi

# ── Write the blog post via Claude ─────────────────────────────────────────
cd "$REPO_DIR"

WRITING_STANDARDS=$(cat "$SKILL_DIR/references/writing-standards.md")
KEYWORD_TRACKER=$(cat "content/blog/keyword-tracker.md")
EXISTING_POSTS=$(ls content/blog/*.md 2>/dev/null | grep -v keyword-tracker | grep -v queue | xargs -I{} basename {} .md | tr '\n' ', ')

ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-$(grep 'ANTHROPIC_API_KEY' /home/tarsagent/.openclaw/workspace/SECRETS.md 2>/dev/null | head -1 | sed 's/.*: *//')}"

POST_FILE="content/blog/${SLUG}.md"

# Skip if post already exists
if [[ -f "$POST_FILE" ]]; then
  echo "[$(date)] Post already exists: $POST_FILE — skipping write step" >> "$LOG_FILE"
else
  echo "[$(date)] Writing post via Claude..." >> "$LOG_FILE"

  PROMPT="You are writing a blog post for SnapBid (snapbid.app), an AI-powered home improvement cost estimator for homeowners.

Post to write:
- Title: $TITLE
- Slug: $SLUG
- Structure template: $STRUCTURE
- Local/project notes: $NOTES
- Project type: $PROJECT_TYPE

WRITING STANDARDS (follow exactly):
$WRITING_STANDARDS

Existing posts (for internal linking — link to at least 3):
$EXISTING_POSTS

Today's date: $(date +%Y-%m-%d)

Output ONLY the complete markdown file content, starting with the frontmatter block. No preamble, no explanation. Just the post.

Frontmatter required fields:
- title
- date: $(date +%Y-%m-%d)
- dateModified: $(date +%Y-%m-%d)
- description (155 chars max, starts with the cost range)
- keywords (array, 3 items: primary keyword + 2 variations)
- author: SnapBid
- readTime: X min read
- wordCount: (estimate)

Requirements:
- Minimum 1,200 words
- At least 1 HTML callout box (styled div per writing standards)
- At least 1 visual element (div-based bar chart or tier comparison cards)
- At least 2–3 colored spans for key numbers
- Affiliate links: use https://www.angi.com and https://www.thumbtack.com as hrefs (no placeholders)
- FTC disclosure at bottom
- CTA woven naturally into content (vary placement and copy vs previous posts)
- Internal links to at least 3 existing posts"

  RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "{
      \"model\": \"claude-opus-4-5\",
      \"max_tokens\": 8000,
      \"messages\": [{\"role\": \"user\", \"content\": $(echo "$PROMPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}]
    }")

  POST_CONTENT=$(echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'content' in data and len(data['content']) > 0:
    print(data['content'][0]['text'])
else:
    print('ERROR: ' + str(data))
")

  if echo "$POST_CONTENT" | grep -q '^ERROR:'; then
    echo "[$(date)] Claude API error: $POST_CONTENT" >> "$LOG_FILE"
    exit 1
  fi

  echo "$POST_CONTENT" > "$POST_FILE"
  echo "[$(date)] Post written: $POST_FILE ($(wc -w < "$POST_FILE") words)" >> "$LOG_FILE"
fi

# ── QA ─────────────────────────────────────────────────────────────────────
echo "[$(date)] Running QA..." >> "$LOG_FILE"
if ! bash scripts/validate-blog.sh >> "$LOG_FILE" 2>&1; then
  echo "[$(date)] QA FAILED for $SLUG — aborting publish" >> "$LOG_FILE"
  exit 1
fi

# ── Publish pipeline ───────────────────────────────────────────────────────
REPLICATE_API_TOKEN="${REPLICATE_API_TOKEN:-$(grep 'REPLICATE_API_TOKEN\|REPLICATE' /home/tarsagent/.openclaw/workspace/SECRETS.md 2>/dev/null | head -1 | sed 's/.*: *//')}"

DESCRIPTION=$(grep '^description:' "$POST_FILE" | head -1 | sed "s/^description: //" | tr -d '"')
COST_RANGE=$(echo "$TITLE" | grep -oP '\$[\d,]+[–-]\$[\d,]+' || echo "See post for details")

REPLICATE_API_TOKEN="$REPLICATE_API_TOKEN" \
bash scripts/publish-blog-post.sh \
  --slug "$SLUG" \
  --title "$TITLE" \
  --description "$DESCRIPTION" \
  --cost "$COST_RANGE" \
  --project-type "$PROJECT_TYPE" \
  --hashtags "#HomeImprovement #HomeRenovation #$(echo "$PROJECT_TYPE" | sed 's/./\u&/')Cost" \
  >> "$LOG_FILE" 2>&1

# ── Mark as done in queue ──────────────────────────────────────────────────
# Replace first unchecked item matching this slug with checked
python3 - <<PYEOF
import re

with open('$QUEUE_FILE', 'r') as f:
    content = f.read()

# Mark the first matching unchecked item as done
pattern = r'^(- \[ \] ' + re.escape('$SLUG') + r'\b.*)'
replacement = r'- [x] $SLUG | published $(date +%Y-%m-%d)'
new_content = re.sub(pattern, replacement, content, count=1, flags=re.MULTILINE)

with open('$QUEUE_FILE', 'w') as f:
    f.write(new_content)

print("Queue updated")
PYEOF

echo "[$(date)] ✅ Done: $TITLE" >> "$LOG_FILE"
