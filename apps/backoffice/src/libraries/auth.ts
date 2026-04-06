import type { BetterAuthClientPlugin } from 'better-auth';
import { adminClient, organizationClient } from 'better-auth/client/plugins';
import { nextCookies } from 'better-auth/next-js';
import { createAuthClient } from 'better-auth/react';
import xior from 'xior';

const basePath = '/auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const roleApplication = {
	admin: 'backoffice',
	producer: 'producer',
	customer: 'customer',
};

function getCookiePrefix() {
	return `${roleApplication[process.env.NEXT_PUBLIC_ROLE_SYSTEM as keyof typeof roleApplication]}.${process.env.NODE_ENV}.auth`;
}

const plugins: BetterAuthClientPlugin[] = [
	nextCookies(),
	adminClient(),
	organizationClient({
		schema: {
			organization: {
				additionalFields: {
					fantasy: {
						type: 'string',
						required: true,
						returned: true,
					},
					cnpj: {
						type: 'string',
						required: true,
						index: true,
						unique: true,
						returned: true,
					},
				},
			},
			member: {
				additionalFields: {
					referral: {
						type: 'string',
						required: true,
						index: true,
						unique: true,
						returned: true,
					},
				},
			},
		},
	}),
];

const auth = createAuthClient({
	baseURL,
	basePath,
	plugins,
	fetchOptions: {
		credentials: 'include',
		priority: 'high',
		headers: new Headers({
			...xior.defaults.headers,
			'X-Client-App': process.env.NEXT_PUBLIC_ROLE_SYSTEM as string,
		}),
	},
	$InferAuth: {
		basePath,
		advanced: {
			cookiePrefix: getCookiePrefix(),
			crossSubDomainCookies: {
				enabled: true,
			},
			useSecureCookies: true,
		},
		plugins,
	},
});

export { auth, getCookiePrefix };
