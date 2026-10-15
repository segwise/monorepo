import z from 'zod';
import {
	refineProducerPaymentDays,
	SchemaProducerStartOfProductionPaymentDays,
	SchemaProducerTypeOfPayment,
} from '../../producers/type';
import { SchemaEmail, SchemaName, SchemaPhone } from '../../utils';
import { SchemaCPFOrCNPJ } from '../../utils/document';

// Cadastro de PRODUTOR interno (admin cadastrando manualmente) — só o
// básico + comissão/pagamento. Sem área de atuação, sem código de
// indicação (gerado automático pelo backend) e sem mensagem promocional —
// isso é específico do fluxo de PARCEIRO (ver register/register.ts).
const SchemaProducerRegisterInternal = z
	.object({
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
		pix: z.string('Chave PIX inválida'),
	})
	.superRefine(refineProducerPaymentDays);

export { SchemaProducerRegisterInternal };
