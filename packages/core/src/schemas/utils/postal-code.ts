import z from 'zod';
import { maskNumber } from '@/masks/number';
import { isPostalCode } from '@/valids/postal-code';

const SchemaPostalCode = z
	.string('CEP inválido')
	.refine(isPostalCode, 'CEP inválido')
	.transform(maskNumber);

export { SchemaPostalCode };
