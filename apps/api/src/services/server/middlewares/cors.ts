import { cors } from 'hono/cors';
import type { MiddlewareHandler } from '@/@types/server';
import { environment } from '@/libraries/environment';

const corsMiddleware: MiddlewareHandler = cors({
	origin: environment.URL_APPLICATION,
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['POST', 'GET', 'OPTIONS'],
	exposeHeaders: ['Content-Length'],
	maxAge: 600,
	credentials: true,
});

export { corsMiddleware };
