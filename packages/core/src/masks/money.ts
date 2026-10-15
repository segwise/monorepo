function maskMoney(value: string) {
	if (!value) {
		return '';
	}

	let clean = value.replace(/^R\$\s*/, '');

	clean = clean.replace(/[^0-9.,]/g, '');
	clean = clean.replace(/\./g, ',');

	if (clean.includes(',')) {
		const [integerPart, decimalPart = ''] = clean.split(',');

		const formattedInteger = integerPart
			?.replace(/^0+(?=\d)/, '')
			.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

		const decimal = decimalPart.slice(0, 2);

		return `R$ ${formattedInteger},${decimal}`;
	}

	const integerOnly = clean.replace(/,/g, '').replace(/^0+(?=\d)/, '') || '0';
	const formatted = integerOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	return `R$ ${formatted}`;
}

export { maskMoney };
