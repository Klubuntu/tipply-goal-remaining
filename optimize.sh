#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")" && pwd)"

rm -rf "$repo_root/app/dist" "$repo_root/dist"

find "$repo_root" -type d -name node_modules -prune -exec rm -rf {} +
find "$repo_root" -type f \( -name 'pnpm-lock.yaml' -o -name 'package-lock.json' -o -name 'yarn.lock' \) -delete

CONFIG_PATH="$repo_root/config.json" \
node <<'NODE'
const fs = require('fs');
const path = require('path');

const configPath = process.env.CONFIG_PATH;
const defaultConfig = {
  goalUrl: '',
  refreshIntervalSeconds: 3,
  theme: 'dark',
};

fs.writeFileSync(configPath, `${JSON.stringify(defaultConfig, null, 2)}\n`);
NODE

printf '%s\n' 'Optimized workspace: cleaned build output, lockfiles, node_modules, and reset config.json.'