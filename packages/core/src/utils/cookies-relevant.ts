const appPrefixes = {
	backoffice: ['backoffice'],
	customer: ['customer'],
	producer: ['producer'],
	app: ['app'],
};

const filterCookies = (
	relevantPrefixes: Array<string>,
	cookieHeader: string,
) => {
	if (!cookieHeader) {
		return null;
	}

	const filtered = cookieHeader
		.split(';')
		.map((c) => c.trim())
		.filter((c) => {
			const isSessionCookie = [
				'backoffice',
				'customer',
				'producer',
				'app',
			].some((prefix) => c.includes(`${prefix}.`));
			if (!isSessionCookie) {
				return true;
			}

			return relevantPrefixes.some((prefix) => c.includes(`${prefix}.`));
		})
		.join('; ');

	return filtered || null;
};

function cookiesAuthRelevant(value: keyof typeof appPrefixes, cookies: string) {
	const relevantPrefixes = appPrefixes[value] ?? [];

	const newCookies = filterCookies(relevantPrefixes, cookies);

	return newCookies;
}

export { cookiesAuthRelevant };
