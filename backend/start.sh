#!/bin/sh
set -e

# Áp migration trước khi khởi động. Trước đây bước này làm tay nên schema trên
# production dễ lệch với repo. `prisma` đã được chuyển sang dependencies để không bị
# `npm prune --omit=dev` trong Dockerfile cắt mất.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Applying database migrations..."
  ./node_modules/.bin/prisma migrate deploy
fi

echo "Starting application..."
if [ -f "dist/src/main.js" ]; then
  node dist/src/main.js
else
  node dist/main
fi
