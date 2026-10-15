import type { Server } from '@/@types/server.d';

import { registerRoutersServicesCNPJ } from './cnpj';
import { registerRoutersServicesCPF } from './cpf';

function registerRoutersServicesCpfOrCnpj(server: Server) {
	const base = server.basePath('/cpf-or-cnpj');

	registerRoutersServicesCPF(base);
	registerRoutersServicesCNPJ(base);
}

export { registerRoutersServicesCpfOrCnpj };
