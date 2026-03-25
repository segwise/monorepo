function getMainDomain(url: string): string {
	let hostname = url.replace(/^https?:\/\//, '');

	hostname = hostname.replace(/:\d+$/, '');

	const parts = hostname.split('.');

	if (parts.length <= 2) {
		return hostname;
	}

	return parts.slice(-2).join('.');
}

export { getMainDomain };
