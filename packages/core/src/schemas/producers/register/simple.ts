import z from 'zod';
import { SchemaEmail, SchemaName, SchemaPhone } from '../../utils';

const SchemaProducerRegister = z.object({
	name: SchemaName,
	phone: SchemaPhone,
	email: SchemaEmail,
});

export { SchemaProducerRegister };
