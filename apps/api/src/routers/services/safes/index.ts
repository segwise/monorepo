import type { Server } from '@/@types/server.d';

import { registerRoutersServicesSafesById } from '@/routers/services/safes/[id]';
import { registerRoutersServicesSafesSimpleListining } from '@/routers/services/safes/listinig';
import { registerRoutersServicesSafesRegister } from '@/routers/services/safes/register';
import { registerRoutersServicesSafesByPlate } from './[plate]';

function registerRoutersServicesSafes(server: Server) {
	const base = server.basePath('/safes');

	registerRoutersServicesSafesById(base);
	registerRoutersServicesSafesByPlate(base);
	registerRoutersServicesSafesRegister(base);
	registerRoutersServicesSafesSimpleListining(base);
}

export { registerRoutersServicesSafes };
