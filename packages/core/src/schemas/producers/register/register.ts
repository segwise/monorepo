import z from 'zod';
import { SchemaReferral } from '../../producers/referral';
import {
	refineProducerPaymentDays,
	SchemaProducerAreaOfActivity,
	SchemaProducerStartOfProductionPaymentDays,
	SchemaProducerTypeOfPayment,
} from '../../producers/type';
import {
	SchemaEmail,
	SchemaName,
	SchemaPassword,
	SchemaPhone,
} from '../../utils';
import { SchemaCPFOrCNPJ } from '../../utils/document';

// Cadastro de PARCEIRO (admin cadastrando manualmente) — área de atuação,
// código de indicação e mensagem promocional fazem parte da parceria
// externa. Produtor interno usa SchemaProducerRegisterInternal, bem mais
// simples (ver register/internal.ts).
const SchemaProducerRegister = z
	.object({
		referral: SchemaReferral,
		type: SchemaProducerAreaOfActivity,
		cpfOrCnpj: SchemaCPFOrCNPJ,
		name: SchemaName,
		phone: SchemaPhone,
		email: SchemaEmail,
		percentage: z.coerce
			.number('Percentual de comissão inválido')
			.min(1, 'Percentual de comissão inválido')
			.max(100, 'Percentual de comissão inválido'),
		typeOfPayment: SchemaProducerTypeOfPayment,
		startOfPayment: SchemaProducerStartOfProductionPaymentDays,
		message: z
			.string('Mensagem de indicação inválida')
			.min(1, 'Mensagem de indicação inválida')
			.nullish(),
		pix: z.string('Chave PIX inválida'),
		// Senha de acesso criada pela corretora no cadastro. Só trafega aqui: o
		// backend guarda apenas o hash e o painel a mostra uma única vez.
		password: SchemaPassword,
	})
	.superRefine(refineProducerPaymentDays);

export { SchemaProducerRegister };
