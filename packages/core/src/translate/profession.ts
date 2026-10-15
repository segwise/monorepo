import type { professions } from '../utils';

type Profession = (typeof professions)[number];

function assertNever(x: never): never {
	throw new Error(`Unexpected value: ${x}`);
}

function translateProfession(profession: Profession): string {
	switch (profession) {
		case 'clt':
			return 'CLT';
		case 'doctor':
			return 'Médico';
		case 'dentist':
			return 'Dentista';
		case 'engineer':
			return 'Engenheiro';
		case 'businessperson':
			return 'Empresário';
		case 'public-employee':
			return 'Funcionário Público';
		case 'lawyer':
			return 'Advogado';
		case 'other':
			return 'Outros';
		default:
			return assertNever(profession);
	}
}

export { translateProfession };
