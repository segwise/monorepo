import z from 'zod';

import { isPhone, normalizePhone } from '../../valids/phone';

const SchemaPhone = z
	.string('Celular inválido')
	.refine(isPhone, 'Celular inválido')
	.trim()
	.transform(normalizePhone);

export { SchemaPhone };
