import { adminClient } from 'better-auth/client/plugins';
import { nextCookies } from 'better-auth/next-js';
import { createAuthClient } from 'better-auth/react';

const roleApplication = {
	admin: 'backoffice',
	producer: 'producer',
	customer: 'customer',
};

const auth = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	basePath: '/auth',
	plugins: [adminClient()],
	fetchOptions: {
		credentials: 'include',
		priority: 'high',
	},
	$InferAuth: {
		basePath: '/auth',
		advanced: {
			cookiePrefix:
				process.env.NODE_ENV === 'production'
					? `${roleApplication[process.env.ROLE_SYSTEM as keyof typeof roleApplication]}.auth`
					: `${roleApplication[process.env.ROLE_SYSTEM as keyof typeof roleApplication]}.${process.env.NODE_ENV}.auth`,
			crossSubDomainCookies: {
				enabled: true,
			},
			useSecureCookies: true,
		},
		plugins: [nextCookies()],
	},
});

export { auth };
