import z from 'zod';
import { maskNumber } from '@/masks/number';
import { validPostalCode } from '@/valids/postal-code';

const SchemaPostalCode = z
	.string('CEP inválido')
	.refine(validPostalCode, 'CEP inválido')
	.transform(maskNumber);

export { SchemaPostalCode };
