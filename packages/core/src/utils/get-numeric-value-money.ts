function getNumericValue(value: string | number) {
	if (!value) {
		return 0;
	}

	if (typeof value === 'number') {
		return value;
	}

	if (value.includes('%')) {
		return Number(value.replace(/%/g, '').replace(/\s/g, '').replace(',', '.'));
	}

	return Number(
		value
			.replace(/R\$\s*/g, '')

			.replace(/\./g, '')
			.replace(',', '.'),
	);
}

export { getNumericValue };
