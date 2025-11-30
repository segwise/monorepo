import type {
	Context as HonoContext,
	MiddlewareHandler as HonoMiddlewareHandler,
} from 'hono';
import type { Resend } from 'resend';
import type { Database } from '@/@types/database';
import type { Environment } from '@/@types/environment';
import type { server } from '@/server';

type Server = typeof server;

type Bindings = Environment;

type Variables = {
	environment: Environment;
	cache: Bun.RedisClient;
	database: Database;
	email: Resend;
};

type AppBindings = {
	Bindings: Bindings;
	Variables: Variables;
};

type Context = HonoContext<AppBindings>;

type MiddlewareHandler = HonoMiddlewareHandler<AppBindings>;

declare module 'hono' {
	interface Context extends Variables {}
}

export type { Server, AppBindings, Context, MiddlewareHandler };
