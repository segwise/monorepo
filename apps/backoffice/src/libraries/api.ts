import xior from 'xior';

const api = xior.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	credentials: 'include',
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
			} else if (value && typeof value === 'object') {
				searchParams.append(key, JSON.stringify(value));
			} else {
				searchParams.append(key, String(value));
			}
		});

		return searchParams.toString();
	},
});

export { api };
