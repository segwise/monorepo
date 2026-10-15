// Letras e números sem os que se confundem (0/O, 1/l/I) e especiais sem os que o
// WhatsApp usa para formatar (* _ ~ `), para a senha poder ser colada numa
// mensagem em negrito sem quebrar nem mudar.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '@#$%&!?';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

// Sorteio uniforme (sem viés de módulo) com o gerador criptográfico do navegador.
function randomIndex(max: number) {
	const limit = Math.floor(0x1_0000_0000 / max) * max;
	const buffer = new Uint32Array(1);

	do {
		crypto.getRandomValues(buffer);
	} while ((buffer[0] as number) >= limit);

	return (buffer[0] as number) % max;
}

const pick = (chars: string) => chars[randomIndex(chars.length)] as string;

// Atende a SchemaPassword do core (mínimo 8, maiúscula, número e especial) com
// folga: 14 caracteres, pelo menos um de cada tipo, embaralhados.
function generatePassword(length = 14) {
	const chars = [
		pick(UPPER),
		pick(LOWER),
		pick(DIGITS),
		pick(SPECIAL),
		...Array.from({ length: length - 4 }, () => pick(ALL)),
	];

	for (let index = chars.length - 1; index > 0; index--) {
		const other = randomIndex(index + 1);

		[chars[index], chars[other]] = [
			chars[other] as string,
			chars[index] as string,
		];
	}

	return chars.join('');
}

export { generatePassword };
