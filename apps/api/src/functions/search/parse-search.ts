import { isCNPJ, isCPF, isPhone, maskNumber } from '@segwise/core';

type ParsedSearch =
	| { kind: 'document'; digits: string }
	| { kind: 'phone'; digits: string }
	| { kind: 'email'; email: string }
	| { kind: 'text'; text: string };

// Mesmo critério das demais buscas do sistema: CPF/CNPJ e celular casam pelos
// dígitos, e-mail pelo prefixo e o restante vira `contains` insensível a
// maiúsculas, que o índice GIN trigram (pg_trgm) atende. Ver
// docs/CONVENTIONS.md (busca e índices).
function parseSearch(search: string): ParsedSearch {
	const term = search.trim();

	if (isCPF(term) || isCNPJ(term)) {
		return { kind: 'document', digits: maskNumber(term) };
	}

	if (isPhone(term)) {
		return { kind: 'phone', digits: maskNumber(term) };
	}

	if (term.includes('@')) {
		return { kind: 'email', email: term.toLowerCase() };
	}

	return { kind: 'text', text: term };
}

export { type ParsedSearch, parseSearch };
