import z from 'zod';

import { maskNumber } from '../../masks/number';
import { isCNPJ } from '../../valids/cnpj';

const SchemaCNPJ = z
	.string('CNPJ inválido')
	.min(14, 'CNPJ inválido')
	.max(18, 'CNPJ inválido')
	.refine((value) => maskNumber(value).length === 14, 'CNPJ inválido')
	.refine(isCNPJ, 'CNPJ inválido')
	.trim()
	.transform(maskNumber);

export { SchemaCNPJ };
