import z from 'zod';
import { SchemaEmail, SchemaName, SchemaPhone } from '../utils';

const SchemaMarketingContact = z.object({
	name: SchemaName,
	email: SchemaEmail,
	phone: SchemaPhone.nullish().or(z.literal('')),
});

export { SchemaMarketingContact };
