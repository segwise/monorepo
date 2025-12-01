import { registerRouters } from '@/routers';
import { server } from '@/server';

registerRouters(server);

export default {
	port: Bun.env.PORT,
	fetch: server.fetch,
	tls: {
		cert: Bun.file('cert/localhost.pem'),
		key: Bun.file('cert/localhost-key.pem'),
	},
};
