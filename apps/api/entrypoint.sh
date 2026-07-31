#!/bin/sh
set -e

bun --bun run db:deploy
bun --bun run db:seed

exec bun --bun run start:server