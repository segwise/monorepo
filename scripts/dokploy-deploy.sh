#!/usr/bin/env bash
# Dispara o deploy do compose da aplicação no Dokploy (compose.deploy).
#
# Variáveis de ambiente (obrigatórias):
#   DOKPLOY_URL      URL base do Dokploy, ex.: https://dokploy.exemplo.com
#   DOKPLOY_API_KEY  token da API (Dokploy → Profile → API/CLI)
#   COMPOSE_ID       composeId do compose (GET /api/project.all)
#
# O compose usa as imagens ghcr.io/segwise/*:latest com pull_policy: always, então o
# deploy só precisa mandar o Dokploy rodar o compose de novo: ele baixa as imagens novas e
# recria apenas os serviços cuja imagem mudou.
set -euo pipefail

: "${DOKPLOY_URL:?DOKPLOY_URL não definida}"
: "${DOKPLOY_API_KEY:?DOKPLOY_API_KEY não definida}"
: "${COMPOSE_ID:?COMPOSE_ID não definida}"

echo "→ compose.deploy: ${COMPOSE_ID}"
curl --silent --show-error --fail-with-body \
	--request POST "${DOKPLOY_URL%/}/api/compose.deploy" \
	--header 'accept: application/json' \
	--header 'Content-Type: application/json' \
	--header "x-api-key: ${DOKPLOY_API_KEY}" \
	--data "$(jq -n --arg id "${COMPOSE_ID}" '{composeId: $id}')"
echo
echo "✔ deploy disparado (o Dokploy executa de forma assíncrona)"
