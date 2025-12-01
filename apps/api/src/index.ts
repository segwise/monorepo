import { registerRouters } from '@/routers';
import { server } from '@/server';
import { registerRoutersAPI } from './routers/api';

registerRouters(server);
registerRoutersAPI(server);

export default {
	port: Bun.env.PORT,
	fetch: server.fetch,
};
