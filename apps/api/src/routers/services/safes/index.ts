import type { Server } from '@/@types/server.d';
import { registerRoutersServicesSafesById } from '@/routers/services/safes/[id]';
import { registerRoutersServicesSafesSimpleListining } from '@/routers/services/safes/listinig';
import { registerRoutersServicesSafesRegister } from '@/routers/services/safes/register';
import { requireSession } from '@/server/middlewares/session';
import { registerRoutersServicesSafesExtractPDF } from './extract-pdf';
import { registerRoutersServicesSafesPrint } from './print';

function registerRoutersServicesSafes(server: Server) {
	const base = server.basePath('/safes');

	// Seguros nunca são públicos: sem sessão a listagem caía na corretora principal.
	base.use(requireSession);

	registerRoutersServicesSafesById(base);
	registerRoutersServicesSafesRegister(base);
	registerRoutersServicesSafesSimpleListining(base);
	registerRoutersServicesSafesExtractPDF(base);
	registerRoutersServicesSafesPrint(base);
}

export { registerRoutersServicesSafes };
