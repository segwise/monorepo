import z from 'zod';
import { isDateString } from '../../valids';

const SchemaDate = z.coerce.date('Data inválida');

const SchemaDateString = z
	.string('Data inválida')
	.refine(isDateString, 'Data inválida');

export { SchemaDate, SchemaDateString };
