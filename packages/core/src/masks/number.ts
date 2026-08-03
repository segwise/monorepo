function maskNumber(value: string) {
	return value.replace(/\D/g, '');
}

function maskDecimal(value: string) {
	let cleaned = value.replace(/[^\d,]/g, '');

	const parts = cleaned.split(',');

	if (parts.length > 2) {
		cleaned = `${parts[0]},${parts.slice(1).join('')}`;
	}

	return cleaned;
}

export { maskNumber, maskDecimal };
