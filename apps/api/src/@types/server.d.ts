import type { Role } from '@segwise/database/enums';
import type { Session } from 'better-auth';
import type { S3Client } from 'bun';
import type {
	Context as HonoContext,
	MiddlewareHandler as HonoMiddlewareHandler,
} from 'hono';
import type { Resend } from 'resend';
import type { Xior } from 'xior';
import type { Database } from '@/@types/database';
import type { Environment } from '@/@types/environment';
import type { auth } from '@/auth';
import type { acquirePage } from '@/libraries/pdf/browser';
import type { server } from '@/server';

type Server = typeof server;

type Bindings = Environment;

type Variables = {
	auth: typeof auth;
	environment: Environment;
	cache: Bun.RedisClient;
	database: Database;
	email: Resend;
	storage: {
		images: S3Client;
		documents: S3Client;
	};
	session: Session & {
		role: Role;
		brokerId?: string | null;
		brokerRole?: Role | null;
		brokerStatus?: 'active' | 'suspended' | 'deleted' | null;
	};
	browser: Awaited<typeof acquirePage>;
	transfeera: Xior;
	timezone: string;
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

export type { AppBindings, Context, MiddlewareHandler, Server };
