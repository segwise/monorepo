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
	SchemaPasswordConfirm,
	SchemaPhone,
} from '../../utils';

// Cadastro de PARCEIRO (admin cadastrando manualmente), sem CPF/CNPJ — área de atuação,
// código de indicação e mensagem promocional fazem parte da parceria
// externa. Produtor interno usa SchemaProducerRegisterInternal, bem mais
// simples (ver register/internal.ts).
const SchemaProducerRegister = z
	.object({
		referral: SchemaReferral,
		type: SchemaProducerAreaOfActivity,
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
		// Senha de acesso criada pela corretora no cadastro (por padrão o celular do
		// parceiro, ou outra digitada/gerada). Só exige o mínimo do better-auth
		// (8 a 128 caracteres): o celular só tem dígitos e não passaria nas regras
		// de senha forte. O backend guarda apenas o hash.
		password: SchemaPasswordConfirm,
	})
	.superRefine(refineProducerPaymentDays);

export { SchemaProducerRegister };
