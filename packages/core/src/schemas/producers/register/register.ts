import z from 'zod';
import { SchemaReferral } from '../../producers/referral';
import {
	SchemaProducerStartOfProductionPayment,
	SchemaProducerType,
	SchemaProducerTypeOfPayment,
} from '../../producers/type';
import { SchemaEmail, SchemaName, SchemaPhone } from '../../utils';
import { SchemaCPFOrCNPJ } from '../../utils/document';

const SchemaProducerRegister = z.object({
	referral: SchemaReferral,
	type: SchemaProducerType,
	cpfOrCnpj: SchemaCPFOrCNPJ,
	name: SchemaName,
	phone: SchemaPhone,
	email: SchemaEmail,
	percentage: z.coerce
		.number('Percentual de comissão inválido')
		.min(1, 'Percentual de comissão inválido')
		.max(100, 'Percentual de comissão inválido'),
	typeOfPayment: SchemaProducerTypeOfPayment,
	startOfPayment: SchemaProducerStartOfProductionPayment,
	message: z
		.string('Mensagem de indicação inválida')
		.min(1, 'Mensagem de indicação inválida')
		.nullish(),
});

export { SchemaProducerRegister };
