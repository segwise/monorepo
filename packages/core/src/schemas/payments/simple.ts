import z from 'zod';

import { SchemaName } from '../utils';
import { SchemaPaymentMethod } from './method';
import { SchemaPaymentStatus } from './status';
import { SchemaPaymentType } from './type';

const SchemaPaymentSimple = z.object({
	id: z.uuidv7('ID inválido'),
	type: SchemaPaymentType,
	method: SchemaPaymentMethod,
	payer: z.object({
		id: z.uuidv7('ID do pagador inválido'),
		name: SchemaName,
		image: z.url('Imagem inválida').nullish(),
		additional: z.string('Campo adicional inválido').nullish(),
	}),
	receiver: z.object({
		id: z.uuidv7('ID do pagador inválido'),
		name: SchemaName,
		image: z.url('Imagem inválida').nullish(),
		additional: z.string('Campo adicional inválido').nullish(),
	}),
	bridge: z
		.object({
			id: z.uuidv7('ID do pagador inválido'),
			description: z
				.string('Descrição do objeto inválida')
				.min(1, 'Descrição do objeto inválida')
				.nullish(),
			additional: z.string('Campo adicional inválido').nullish(),
		})
		.nullish(),
	description: z
		.string('Descrição do pagamento inválida')
		.min(1, 'Descrição do pagamento inválida')
		.nullish(),
	amount: z.coerce
		.number('Valor do pagamento inválido')
		.min(0, 'Valor do pagamento inválido'),
	amountPaid: z.coerce
		.number('Valor pago inválido')
		.min(0, 'Valor pago inválido')
		.nullish(),
	expiration: z.date('Data de vencimento inválida'),
	paidAt: z.date('Data de pagamento inválida').nullish(),
	status: SchemaPaymentStatus,
});

export { SchemaPaymentSimple };
