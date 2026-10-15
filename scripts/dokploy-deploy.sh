#!/usr/bin/env bash
# Aponta uma Application do Dokploy para uma imagem do GHCR e dispara o deploy.
#
# Variáveis de ambiente (obrigatórias):
#   DOKPLOY_URL      URL base do Dokploy, ex.: https://dokploy.exemplo.com
#   DOKPLOY_API_KEY  token da API (Dokploy → Profile → API/CLI)
#   APPLICATION_ID   applicationId do serviço (GET /api/project.all)
#   IMAGE            imagem completa com tag, ex.: ghcr.io/segwise/monorepo/api:sha-abc1234
#
# Opcional: REGISTRY_URL (padrão ghcr.io). Imagens públicas não precisam de credenciais.
set -euo pipefail

: "${DOKPLOY_URL:?DOKPLOY_URL não definida}"
: "${DOKPLOY_API_KEY:?DOKPLOY_API_KEY não definida}"
: "${APPLICATION_ID:?APPLICATION_ID não definida}"
: "${IMAGE:?IMAGE não definida}"
REGISTRY_URL="${REGISTRY_URL:-ghcr.io}"

call() {
	local endpoint="$1" body="$2"
	curl --silent --show-error --fail-with-body \
		--request POST "${DOKPLOY_URL%/}/api/${endpoint}" \
		--header 'accept: application/json' \
		--header 'Content-Type: application/json' \
		--header "x-api-key: ${DOKPLOY_API_KEY}" \
		--data "${body}"
	echo
}

echo "→ application.saveDockerProvider: ${APPLICATION_ID} → ${IMAGE}"
call application.saveDockerProvider "$(
	jq -n --arg id "${APPLICATION_ID}" --arg image "${IMAGE}" --arg registry "${REGISTRY_URL}" \
		'{applicationId: $id, dockerImage: $image, username: null, password: null, registryUrl: $registry}'
)"

echo "→ application.deploy: ${APPLICATION_ID}"
call application.deploy "$(jq -n --arg id "${APPLICATION_ID}" '{applicationId: $id}')"

echo "✔ deploy disparado (o Dokploy executa de forma assíncrona)"
