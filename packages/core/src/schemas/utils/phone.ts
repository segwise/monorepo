import z from 'zod';

import { maskNumber } from '@/masks/number';

import { isPhone } from '@/valids/phone';

const SchemaPhone = z
	.string('Celular inválido')
	.refine(isPhone, 'Celular inválido')
	.trim()
	.transform(maskNumber);

export { SchemaPhone };
