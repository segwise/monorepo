import { cors } from 'hono/cors';
import type { MiddlewareHandler } from '@/@types/server';

const corsMiddleware: MiddlewareHandler = cors({
	origin: 'http://localhost:3000',
	credentials: true,
});

const corsAuthMiddleware: MiddlewareHandler = cors({
	origin: 'http://localhost:3000',
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['POST', 'GET', 'OPTIONS'],
	exposeHeaders: ['Content-Length'],
	maxAge: 600,
	credentials: true,
});

export { corsMiddleware, corsAuthMiddleware };
