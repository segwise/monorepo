#!/usr/bin/env bash
# Dispara o deploy do compose da aplicação no Dokploy e ESPERA o resultado.
#
# Variáveis de ambiente (obrigatórias):
#   DOKPLOY_URL      URL base do Dokploy, ex.: https://dokploy.exemplo.com
#   DOKPLOY_API_KEY  token da API (Dokploy → Profile → API/CLI)
#   COMPOSE_ID       composeId do compose (GET /api/project.all)
#
# Opcionais:
#   HEALTHCHECK_URLS             URLs públicas (separadas por espaço) a verificar depois do deploy. Cada
#                                entrada pode ter um sufixo "#<status>" com o HTTP EXATO esperado, ex.:
#                                https://x.com/sign-in#200 (o fragmento não é enviado ao servidor). Sem
#                                sufixo, qualquer resposta abaixo de 500 serve. Prefira o status exato:
#                                "< 500" deixa passar um 404 numa rota errada. Vazio = pula esta etapa.
#   EXPECTED_VERSION             SHA do commit que acabou de ser publicado. Se definido, cada URL tem
#                                que devolver o header "X-App-Version" igual a ele: prova que é a
#                                versão NOVA respondendo (uma antiga ou outro serviço no domínio
#                                reprova). Vazio = só confere o status.
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
EXPECTED_VERSION="${EXPECTED_VERSION:-}"
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
# rodando (e o container antigo pode demorar a sair), então as URLs ganham um tempo para responder
# com o status esperado e a versão nova.
for entry in ${HEALTHCHECK_URLS}; do
	url="${entry%%#*}"
	expected_status=""
	if [[ "${entry}" == *"#"* ]]; then
		expected_status="${entry##*#}"
	fi

	echo "→ verificando ${url}${expected_status:+ (esperado HTTP ${expected_status})}"
	deadline=$((SECONDS + HEALTHCHECK_TIMEOUT_SECONDS))
	while :; do
		# Cabeçalhos em stdout (-D -) e o status ao final; o corpo é descartado.
		response="$(curl --silent --output /dev/null --dump-header - --max-time 15 \
			--write-out 'HTTPCODE:%{http_code}' "${url}" || true)"
		code="${response##*HTTPCODE:}"
		version="$(printf '%s' "${response}" | tr -d '\r' |
			awk -F': ' 'tolower($1) == "x-app-version" { print $2; exit }')"

		if [ -n "${expected_status}" ]; then
			status_ok=$([ "${code}" = "${expected_status}" ] && echo 1 || echo 0)
		else
			status_ok=$([ "${code}" != "000" ] && [ "${code}" -lt 500 ] && echo 1 || echo 0)
		fi
		version_ok=1
		if [ -n "${EXPECTED_VERSION}" ] && [ "${version}" != "${EXPECTED_VERSION}" ]; then
			version_ok=0
		fi

		if [ "${status_ok}" = 1 ] && [ "${version_ok}" = 1 ]; then
			echo "  ${url} → HTTP ${code}${EXPECTED_VERSION:+, versão ${version:0:7}}"
			break
		fi
		if [ "${SECONDS}" -ge "${deadline}" ]; then
			echo "::error::${url} não ficou correta em ${HEALTHCHECK_TIMEOUT_SECONDS}s: último HTTP ${code}, versão ${version:-ausente}${EXPECTED_VERSION:+ (esperado ${EXPECTED_VERSION})}."
			exit 1
		fi
		sleep "${POLL_INTERVAL_SECONDS}"
	done
done
echo "✔ todas as URLs responderam${EXPECTED_VERSION:+ na versão ${EXPECTED_VERSION:0:7}}"
