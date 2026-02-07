function maskNumber(value: string): string {
	return value.replace(/\D/g, '');
}

export { maskNumber };
