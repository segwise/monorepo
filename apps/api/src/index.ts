import { registerRouters } from '@/routers';
import { server } from '@/server';

registerRouters(server);

export default {
	port: Bun.env.PORT,
	fetch: server.fetch,
};
