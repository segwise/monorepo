function isPlate(value: string) {
	const regex = /[A-Z]{3}[0-9][0-9A-Z][0-9]{2}/i;

	return !!value.replaceAll('-', '').match(regex);
}

export { isPlate };
