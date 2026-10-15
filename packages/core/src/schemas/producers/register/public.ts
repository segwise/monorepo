import z from 'zod';
import { SchemaReferral } from '../../producers/referral';
import { SchemaProducerAreaOfActivity } from '../../producers/type';
import { SchemaEmail, SchemaName, SchemaPhone } from '../../utils';
import { SchemaCPFOrCNPJ } from '../../utils/document';

const SchemaProducerPublicRegister = z.object({
	cpfOrCnpj: SchemaCPFOrCNPJ,
	name: SchemaName,
	phone: SchemaPhone,
	email: SchemaEmail,
	pix: z.string('Chave PIX inválida'),
	type: SchemaProducerAreaOfActivity,
	referral: SchemaReferral,
});

export { SchemaProducerPublicRegister };
