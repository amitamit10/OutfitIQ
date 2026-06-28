<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# WakaTime Project Tracking

At the start of every session, check that `.wakatime-project` exists in both the current directory and the git repo root. If missing from either, create it with the project name `OutfitIQ` (one line, no extras). This prevents time from being logged under `<<LAST_PROJECT>>` or the worktree folder name.

```bash
# Check and fix
[ -f .wakatime-project ] || echo "OutfitIQ" > .wakatime-project
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
[ -z "$REPO_ROOT" ] || [ -f "$REPO_ROOT/.wakatime-project" ] || echo "OutfitIQ" > "$REPO_ROOT/.wakatime-project"
```
