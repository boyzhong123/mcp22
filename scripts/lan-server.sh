#!/bin/bash
# Keep the LAN preview server running from the Next.js standalone build.
# Managed by launchd (see ~/Library/LaunchAgents/com.chivox.lan.plist).
set -e

ROOT="/Users/zhong/Desktop/ChivoxMCP-global"
STANDALONE="$ROOT/.next/standalone"

# Ensure static assets are available next to the standalone server.
rm -rf "$STANDALONE/public" "$STANDALONE/.next/static"
cp -R "$ROOT/public" "$STANDALONE/public"
cp -R "$ROOT/.next/static" "$STANDALONE/.next/static"

cd "$STANDALONE"
export HOSTNAME=0.0.0.0
export PORT=3000
exec /opt/homebrew/opt/node@20/bin/node server.js
