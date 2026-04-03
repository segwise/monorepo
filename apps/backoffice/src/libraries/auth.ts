import type { BetterAuthClientPlugin } from 'better-auth';
import { adminClient, organizationClient } from 'better-auth/client/plugins';
import { nextCookies } from 'better-auth/next-js';
import { createAuthClient } from 'better-auth/react';

const basePath = '/auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const roleApplication = {
	admin: 'backoffice',
	producer: 'producer',
	customer: 'customer',
};

const cookiePrefix =
	process.env.NODE_ENV === 'production'
		? `${roleApplication[process.env.ROLE_SYSTEM as keyof typeof roleApplication]}.auth`
		: `${roleApplication[process.env.ROLE_SYSTEM as keyof typeof roleApplication]}.${process.env.NODE_ENV}.auth`;

console.log(cookiePrefix);

const plugins: BetterAuthClientPlugin[] = [
	nextCookies(),
	adminClient(),
	organizationClient(),
];

const auth = createAuthClient({
	baseURL,
	basePath,
	plugins,
	fetchOptions: {
		credentials: 'include',
		priority: 'high',
	},
	$InferAuth: {
		basePath,
		advanced: {
			cookiePrefix,
			crossSubDomainCookies: {
				enabled: true,
			},
			useSecureCookies: true,
		},
		plugins,
	},
});

export { auth };
