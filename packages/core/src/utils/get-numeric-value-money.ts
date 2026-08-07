function getNumericValueMoney(value: string | number) {
	if (!value) {
		return 0;
	}

	if (typeof value === 'number') {
		return value;
	}

	return Number(
		value
			.replace(/R\$\s*/g, '')
			.replace(/%/g, '')
			.replace(/\./g, '')
			.replace(',', '.'),
	);
}

export { getNumericValueMoney };
