import z from 'zod';

import { isPlate } from '../../../valids/plate';

const SchemaPlate = z
	.string('Placa inválida')
	.refine(isPlate, 'Placa inválida')
	.trim()
	.toLowerCase()
	.transform((value) => value.replace('-', ''))
	.transform((value) => value.replace(' ', ''))
	.transform((value) => (isPlate(value) ? value : null));

export { SchemaPlate };
