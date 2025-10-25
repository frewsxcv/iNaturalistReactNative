#!/bin/bash

# This script generates a CSV file with the number of JavaScript and TypeScript
# files for each commit in the git history.

set -e

# Output file
OUTPUT_FILE="ts_migration_stats.csv"
# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
OUTPUT_PATH="$SCRIPT_DIR/$OUTPUT_FILE"

# Header for the CSV file
echo "date,js_files,ts_files" > "$OUTPUT_PATH"

# Get the current branch to return to it later
initial_branch=$(git rev-parse --abbrev-ref HEAD)
# And the current directory
initial_dir=$(pwd)

# Go to the root of the repo
cd "$(git rev-parse --show-toplevel)"

echo "Generating migration stats. This may take a while..."

# Iterate over all commits in reverse chronological order
git rev-list --reverse HEAD | while read commit; do
  # Get the commit date in YYYY-MM-DD format
  commit_date=$(git show -s --format=%ci $commit | awk '{print $1}')

  # Use git ls-tree to count files without checking out
  files=$(git ls-tree --name-only -r $commit src)

  if [ -n "$files" ]; then
    js_count=$(echo "$files" | grep -E '\.(js|jsx)$' | wc -l | tr -d ' ')
    ts_count=$(echo "$files" | grep -E '\.(ts|tsx)$' | wc -l | tr -d ' ')
  else
    js_count=0
    ts_count=0
  fi

  # Append the data to the CSV file
  echo "$commit_date,$js_count,$ts_count" >> "$OUTPUT_PATH"

  echo "Processed commit $commit from $commit_date: JS=$js_count, TS=$ts_count"
done

# Return to the initial directory
cd "$initial_dir"

echo "Data saved to $OUTPUT_PATH"