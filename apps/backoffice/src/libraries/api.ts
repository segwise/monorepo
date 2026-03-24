import xior from 'xior';

const api = xior.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	credentials: 'include',
});

api.interceptors.request.use(async (config) => {
	if (process.env.NODE_ENV === 'development') {
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(true);
			}, 1000);
		});
	}

	return config;
});

export { api };
