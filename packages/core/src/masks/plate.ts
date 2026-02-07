function maskPlate(plate: string): string {
	const placa = plate.toUpperCase().replace(/\W/g, '');

	const validadorPosicoes = [
		/[A-Z]/,
		/[A-Z]/,
		/[A-Z]/,
		/\d/,
		/[A-Z0-9]/,
		/\d/,
		/\d/,
	];

	let placaMascarada = '';
	let posicaoAtual = 0;

	for (const regex of validadorPosicoes) {
		const caractereAtual = placa[posicaoAtual];

		if (!caractereAtual || !regex.test(caractereAtual)) {
			break;
		}

		placaMascarada += caractereAtual;
		posicaoAtual++;
	}

	if (placaMascarada.length === 7 && /[A-Z]$/.test(placaMascarada[4] || '')) {
		return placaMascarada.replace(/^(\w{3})(\w{1})(\w{2})$/, '$1$2$3');
	} else if (
		[6, 7].includes(placaMascarada.length) &&
		/[0-9]$/.test(placaMascarada[4] || '')
	) {
		return placaMascarada.replace(/^(\w{3})(\w{4})$/, '$1-$2');
	}

	return placaMascarada;
}

export { maskPlate };
