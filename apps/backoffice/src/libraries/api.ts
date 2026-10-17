import { cookiesAuthRelevant } from '@segwise/core';
import xior from 'xior';
import { apiBaseURL, clientIpHeaders } from './api-url';

const api = xior.create({
	baseURL: apiBaseURL,
	credentials: 'include',
	headers: {
		...xior.defaults.headers,
		'X-Client-App': process.env.NEXT_PUBLIC_ROLE_SYSTEM,
		'X-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
	},
	paramsSerializer: (params) => {
		const searchParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null) {
				return;
			}

			if (Array.isArray(value)) {
				value.forEach((item) => {
					searchParams.append(key, String(item));
				});
			} else if (value && typeof value === 'object' && !Array.isArray(value)) {
				searchParams.append(key, JSON.stringify(value));
			} else if (
				value &&
				typeof value === 'string' &&
				value.includes(',') &&
				value.split(',').length > 1 &&
				!(value.includes('{') && value.includes('}'))
			) {
				const values = value.split(',');

				for (const value of values) {
					searchParams.append(key, String(value));
				}
			} else {
				try {
					const json = JSON.parse(value);

					searchParams.append(key, JSON.stringify(json));
				} catch {
					searchParams.append(key, String(value));
				}
			}
		});

		return searchParams.toString();
	},
});

api.interceptors.request.use(
	async (config) => {
		if (typeof window === 'undefined') {
			try {
				const { cookies, headers } = await import('next/headers');

				const cookieStore = await cookies();

				config.headers = {
					...config.headers,
					...clientIpHeaders(await headers()),
				};

				const cookieString = cookiesAuthRelevant(
					// @ts-expect-error
					process.env.NEXT_PUBLIC_ROLE_SYSTEM,
					cookieStore.toString() ?? '',
				);

				if (cookieString) {
					config.headers = {
						...config.headers,
						cookie: cookieString,
					};
				}
			} catch {}
		}

		config.headers = {
			...config.headers,
			'X-Client-App': process.env.NEXT_PUBLIC_ROLE_SYSTEM,
		};

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

export { api };
