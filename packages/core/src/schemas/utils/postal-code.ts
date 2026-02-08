import z from 'zod';
import { maskNumber } from '../../masks';
import { validPostalCode } from '../../valids';

const SchemaPostalCode = z
	.string('CEP inválido')
	.refine(validPostalCode, 'CEP inválido')
	.transform(maskNumber);

export { SchemaPostalCode };
