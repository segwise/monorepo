#!/usr/bin/env bash
# Dispara o deploy do compose da aplicação no Dokploy e ESPERA o resultado.
#
# Variáveis de ambiente (obrigatórias):
#   DOKPLOY_URL      URL base do Dokploy, ex.: https://dokploy.exemplo.com
#   DOKPLOY_API_KEY  token da API (Dokploy → Profile → API/CLI)
#   COMPOSE_ID       composeId do compose (GET /api/project.all)
#
# Opcionais:
#   HEALTHCHECK_URLS             URLs públicas (separadas por espaço) que devem responder < 500
#                                depois do deploy (qualquer resposta HTTP abaixo de 500 conta: a api
#                                devolve 404 em "/"). Vazio = pula o teste de fumaça.
#   DEPLOY_TIMEOUT_SECONDS       espera pelo deploy do Dokploy (padrão 900)
#   HEALTHCHECK_TIMEOUT_SECONDS  espera pelas URLs (padrão 240)
#   POLL_INTERVAL_SECONDS        intervalo entre consultas (padrão 10)
#
# O compose usa as imagens ghcr.io/segwise/*:latest com pull_policy: always, então o deploy só
# precisa mandar o Dokploy rodar o compose de novo.
#
# SEGURANÇA: a resposta de compose.one traz o campo `env` com TODOS os segredos do compose, e o log
# das Actions é público. Por isso essa resposta NUNCA é impressa: o jq extrai só id e status.
# Não use `set -x` aqui.
set -euo pipefail

: "${DOKPLOY_URL:?DOKPLOY_URL não definida}"
: "${DOKPLOY_API_KEY:?DOKPLOY_API_KEY não definida}"
: "${COMPOSE_ID:?COMPOSE_ID não definida}"
HEALTHCHECK_URLS="${HEALTHCHECK_URLS:-}"
DEPLOY_TIMEOUT_SECONDS="${DEPLOY_TIMEOUT_SECONDS:-900}"
HEALTHCHECK_TIMEOUT_SECONDS="${HEALTHCHECK_TIMEOUT_SECONDS:-240}"
POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-10}"

base="${DOKPLOY_URL%/}/api"

# Diagnóstico seguro (só NOMES de campos, nunca valores): ajuda a ajustar o jq se a versão do Dokploy
# usar outros nomes. Imprime algo como {"compose":[...],"deployment":[...]}.
describe_shape() {
	curl --silent --fail-with-body --get "${base}/compose.one" \
		--data-urlencode "composeId=${COMPOSE_ID}" \
		--header "x-api-key: ${DOKPLOY_API_KEY}" 2>/dev/null |
		jq -c '{compose: keys, deployment: ((.deployments // []) | last // {} | keys)}' 2>/dev/null || true
}

# Última execução (deploy) do compose: "<deploymentId>\t<status>", ou "\t" se não houver nenhuma.
latest_deployment() {
	curl --silent --show-error --fail-with-body --get "${base}/compose.one" \
		--data-urlencode "composeId=${COMPOSE_ID}" \
		--header 'accept: application/json' \
		--header "x-api-key: ${DOKPLOY_API_KEY}" |
		jq -r '(.deployments // []) | sort_by(.createdAt) | last
			| if . == null then "\t" else "\(.deploymentId // "")\t\(.status // "")" end'
}

if ! previous_deployment="$(latest_deployment)"; then
	echo "::error::Não foi possível consultar o compose no Dokploy (confira DOKPLOY_URL, DOKPLOY_API_KEY e DOKPLOY_COMPOSE_ID)."
	exit 1
fi
previous_id="$(printf '%s' "${previous_deployment}" | cut -f1)"

echo "→ compose.deploy: ${COMPOSE_ID}"
curl --silent --show-error --fail-with-body \
	--request POST "${base}/compose.deploy" \
	--header 'accept: application/json' \
	--header 'Content-Type: application/json' \
	--header "x-api-key: ${DOKPLOY_API_KEY}" \
	--data "$(jq -n --arg id "${COMPOSE_ID}" '{composeId: $id}')"
echo

echo "→ aguardando o deploy no Dokploy (até ${DEPLOY_TIMEOUT_SECONDS}s)"
deadline=$((SECONDS + DEPLOY_TIMEOUT_SECONDS))
last_status=""
while :; do
	if [ "${SECONDS}" -ge "${deadline}" ]; then
		echo "::error::Tempo esgotado esperando o deploy terminar no Dokploy."
		echo "Campos da resposta de compose.one (só nomes): $(describe_shape)"
		exit 1
	fi

	sleep "${POLL_INTERVAL_SECONDS}"
	# Erro pontual da API durante a espera não derruba o script: tenta de novo no próximo ciclo.
	polled="$(latest_deployment 2>/dev/null || true)"
	current_id="$(printf '%s' "${polled}" | cut -f1)"
	current_status="$(printf '%s' "${polled}" | cut -f2)"

	# Ainda não apareceu a execução disparada por nós (a anterior continua sendo a última).
	if [ -z "${current_id}" ] || [ "${current_id}" = "${previous_id}" ]; then
		continue
	fi

	if [ "${current_status}" != "${last_status}" ]; then
		echo "  deploy ${current_id}: ${current_status}"
		last_status="${current_status}"
	fi

	case "${current_status}" in
	done) break ;;
	error)
		echo "::error::O deploy falhou no Dokploy. Veja o log do deployment ${current_id} no painel (Compose → Deployments)."
		exit 1
		;;
	esac
done
echo "✔ deploy concluído no Dokploy"

if [ -z "${HEALTHCHECK_URLS}" ]; then
	echo "::notice::HEALTHCHECK_URLS não definida; teste de fumaça das URLs ignorado."
	exit 0
fi

# `up -d` devolve assim que os containers iniciam; os healthchecks do compose ainda podem estar
# rodando, então as URLs ganham um tempo para responder.
for url in ${HEALTHCHECK_URLS}; do
	echo "→ verificando ${url}"
	deadline=$((SECONDS + HEALTHCHECK_TIMEOUT_SECONDS))
	code="000"
	while :; do
		code="$(curl --silent --output /dev/null --max-time 15 --write-out '%{http_code}' "${url}" || true)"
		if [ "${code}" != "000" ] && [ "${code}" -lt 500 ]; then
			echo "  ${url} → HTTP ${code}"
			break
		fi
		if [ "${SECONDS}" -ge "${deadline}" ]; then
			echo "::error::${url} não respondeu (último HTTP ${code}) em ${HEALTHCHECK_TIMEOUT_SECONDS}s depois do deploy."
			exit 1
		fi
		sleep "${POLL_INTERVAL_SECONDS}"
	done
done
echo "✔ todas as URLs responderam"
