function getNumericValueMoney(value: string) {
	if (!value) {
		return 0;
	}

	return Number(
		value
			.replace(/R\$\s*/g, '')
			.replace(/\./g, '')
			.replace(',', '.'),
	);
}

export { getNumericValueMoney };
