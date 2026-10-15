#!/bin/sh
set -e

bun --bun run --cwd ../../packages/database deploy
# bun --bun run db:seed

exec bun --bun run start