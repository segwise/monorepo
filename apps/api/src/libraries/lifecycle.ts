// Estado de desligamento do processo, num módulo sem dependências para evitar import circular entre o
// shutdown (que fecha o worker) e o worker (que precisa saber que o processo está parando).
let stopping = false;

function isStopping() {
	return stopping;
}

function markStopping() {
	stopping = true;
}

export { isStopping, markStopping };
