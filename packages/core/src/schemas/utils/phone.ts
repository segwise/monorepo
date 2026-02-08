import z from 'zod';
import { maskNumber } from '../../masks';
import { isPhone } from '../../valids';

const SchemaPhone = z
	.string('Celular inválido')
	.refine(isPhone, 'Celular inválido')
	.trim()
	.transform(maskNumber);

export { SchemaPhone };
