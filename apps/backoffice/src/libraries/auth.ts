import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

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
			cookiePrefix: 'auth',
			crossSubDomainCookies: {
				enabled: true,
			},
			useSecureCookies: true,
		},
	},
});

export { auth };
