import z from 'zod';

import { maskNumber } from '@/masks/number';

import { isCPF } from '@/valids/cpf';

const SchemaCPF = z
	.string('CPF inválido')
	.min(11, 'CPF inválido')
	.max(14, 'CPF inválido')
	.refine((value) => maskNumber(value).length === 11, 'CPF inválido')
	.refine(isCPF, 'CPF inválido')
	.trim()
	.transform(maskNumber);

export { SchemaCPF };
