#!/bin/sh
# Used by .github/workflows/weekly.yml: opens an issue, or updates the open one whose title starts the same way,
# so each look-out keeps at most one open issue. Once it's closed, the next run that finds something opens a new one.
# Usage: sh .github/issue.sh "<start of the title>" "<title>" "<body>"   (needs GH_TOKEN)
issue=$(gh issue list --state open --search "in:title \"$1\"" --json number,title --jq "[.[] | select(.title | startswith(\"$1\"))][0].number // empty")
if [ -n "$issue" ]; then gh issue edit "$issue" --title "$2" --body "$3"; else gh issue create --title "$2" --body "$3"; fi
