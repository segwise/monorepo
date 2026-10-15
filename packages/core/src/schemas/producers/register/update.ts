import z from 'zod';
import { SchemaReferral } from '../../producers/referral';
import {
	refineProducerPaymentDays,
	SchemaProducerAreaOfActivity,
	SchemaProducerStartOfProductionPaymentDays,
	SchemaProducerTypeOfPayment,
} from '../../producers/type';
import { SchemaName, SchemaPhone } from '../../utils';

// Edição de PARCEIRO já cadastrado. E-mail e CPF/CNPJ ficam de fora de
// propósito — são identidade do usuário, não dá pra editar por aqui.
const SchemaProducerPartnerUpdate = z
	.object({
		name: SchemaName,
		phone: SchemaPhone,
		type: SchemaProducerAreaOfActivity,
		referral: SchemaReferral,
		percentage: z.coerce
			.number('Percentual de comissão inválido')
			.min(1, 'Percentual de comissão inválido')
			.max(100, 'Percentual de comissão inválido'),
		typeOfPayment: SchemaProducerTypeOfPayment,
		startOfPayment: SchemaProducerStartOfProductionPaymentDays,
		pix: z.string('Chave PIX inválida'),
	})
	.superRefine(refineProducerPaymentDays);

// Edição de PRODUTOR interno já cadastrado — mesma regra: sem e-mail/CPF,
// sem área de atuação, sem código de indicação.
const SchemaProducerInternalUpdate = z
	.object({
		name: SchemaName,
		phone: SchemaPhone,
		percentage: z.coerce
			.number('Percentual de comissão inválido')
			.min(1, 'Percentual de comissão inválido')
			.max(100, 'Percentual de comissão inválido'),
		typeOfPayment: SchemaProducerTypeOfPayment,
		startOfPayment: SchemaProducerStartOfProductionPaymentDays,
		pix: z.string('Chave PIX inválida'),
	})
	.superRefine(refineProducerPaymentDays);

export { SchemaProducerInternalUpdate, SchemaProducerPartnerUpdate };
