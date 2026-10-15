function getMainDomain(url: string): string {
	let hostname = url.replace(/^https?:\/\//i, '');

	hostname = hostname.replace(/:\d+$/, '');

	hostname = hostname.split('/')[0] as string;

	const parts = hostname.toLowerCase().split('.');

	if (parts.length <= 1) {
		return hostname;
	}

	const lastTwo = parts.slice(-2).join('.');
	const brSecondLevel = [
		'com.br',
		'net.br',
		'org.br',
		'gov.br',
		'edu.br',
		'ind.br',
		'emp.br',
		'adv.br',
	];

	if (brSecondLevel.includes(lastTwo)) {
		return parts.slice(-3).join('.');
	}

	return parts.slice(-2).join('.');
}

export { getMainDomain };
