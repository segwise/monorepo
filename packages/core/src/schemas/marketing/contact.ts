import z from 'zod';
import {
	SchemaBrazilianState,
	SchemaEmail,
	SchemaName,
	SchemaPhone,
} from '../utils';

const SchemaMarketingContact = z.object({
	name: SchemaName,
	email: SchemaEmail,
	phone: SchemaPhone.nullish().or(z.literal('')),
	city: z.string('Cidade inválida').trim().min(2, 'Informe a cidade'),
	state: SchemaBrazilianState,
});

export { SchemaMarketingContact };
