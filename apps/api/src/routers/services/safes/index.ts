import type { Server } from '@/@types/server.d';
import { registerRoutersServicesSafesById } from '@/routers/services/safes/[id]';
import { registerRoutersServicesSafesSimpleListining } from '@/routers/services/safes/listinig';
import { registerRoutersServicesSafesRegister } from '@/routers/services/safes/register';
import { requireSession } from '@/server/middlewares/session';
import { registerRoutersServicesSafesExtractPDF } from './extract-pdf';
import { registerRoutersServicesSafesPrint } from './print';

function registerRoutersServicesSafes(server: Server) {
	const base = server.basePath('/safes');

	// Seguros não são públicos: sem sessão a listagem caía na corretora principal.
	// Exceções, usadas pelo app do segurado sem login: consulta por CPF +
	// nascimento, consulta por placa e listagem de `ids` específicos (UUIDs
	// guardados no aparelho).
	base.use(async (ctx, next) => {
		const path = ctx.req.path;
		const isPublic =
			ctx.req.method === 'GET' &&
			(path.endsWith('/simple/registration') ||
				/\/simple\/plate\/[^/]+$/.test(path) ||
				(path.endsWith('/simple') && ctx.req.queries('ids')?.length));

		if (isPublic) {
			return await next();
		}

		return await requireSession(ctx, next);
	});

	registerRoutersServicesSafesById(base);
	registerRoutersServicesSafesRegister(base);
	registerRoutersServicesSafesSimpleListining(base);
	registerRoutersServicesSafesExtractPDF(base);
	registerRoutersServicesSafesPrint(base);
}

export { registerRoutersServicesSafes };
