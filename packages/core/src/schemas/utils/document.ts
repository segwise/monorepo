import z from 'zod';

import { maskNumber } from '../../masks/number';
import { SchemaCNPJ } from './cnpj';
import { SchemaCPF } from './cpf';
import { SchemaDate } from './date';
import { SchemaName } from './name';

const SchemaCPFOrCNPJ = z
	.string('Documento inválido')
	.refine(
		(value) => SchemaCPF.or(SchemaCNPJ).safeParse(value).success,
		'Documento inválido',
	)
	.trim()
	.transform(maskNumber);

const SchemaDocument = z.object({
	name: SchemaName,
	cpfOrCnpj: SchemaCPFOrCNPJ,
	birth: SchemaDate,
});

export { SchemaDocument, SchemaCPFOrCNPJ };
