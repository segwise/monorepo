import z from 'zod';
import { SchemaEmail, SchemaName, SchemaPhone } from '../../utils';
import { SchemaCPFOrCNPJ } from '../../utils/document';

const SchemaProducerPublicRegister = z.object({
	cpfOrCnpj: SchemaCPFOrCNPJ,
	name: SchemaName,
	phone: SchemaPhone,
	email: SchemaEmail,
	pix: z.string('Chave PIX inválida'),
});

export { SchemaProducerPublicRegister };
