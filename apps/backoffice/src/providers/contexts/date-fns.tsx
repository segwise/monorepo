'use client';

import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';

setDefaultOptions({
	locale: ptBR,
});

function ProviderDateFns() {
	return null;
}

export { ProviderDateFns };
