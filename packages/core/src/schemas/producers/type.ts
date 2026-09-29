import z from 'zod';

const SchemaProducerType = z.enum(
	[
		'gym',
		'accountants',
		'driving_school',
		'university',
		'condominium_management',
		'oil_change',
		'youtuber',
		'promoters',
		'digital_marketing',
		'buying_group',
		'gas_station',
		'restaurant',
		'influencer',
		'producer',
		'syndicate',
	],
	'Tipo de parceiro inválido',
);

// Mesmas opções de SchemaProducerType, exceto "producer" — usado no
// cadastro público de parceiro, onde produtor interno não é uma opção
// (produtor e parceiro serão separados futuramente).
const SchemaProducerAreaOfActivity = z.enum(
	[
		'gym',
		'accountants',
		'driving_school',
		'university',
		'condominium_management',
		'oil_change',
		'youtuber',
		'promoters',
		'digital_marketing',
		'buying_group',
		'gas_station',
		'restaurant',
		'influencer',
		'syndicate',
	],
	'Área de atuação inválida',
);

const SchemaProducerTypeOfPayment = z.enum(
	['weekly', 'bi_weekly', 'monthly'],
	'Tipo de pagamento inválido',
);

const SchemaProducerStartOfProductionPayment = z.literal(
	[1, 3, 5, 8, 10, 15],
	'Data de pagamento de comissão inválida',
);

// Mensal usa 1 dia de pagamento; quinzenal precisa de 2 dias distintos.
const SchemaProducerStartOfProductionPaymentDays = z
	.array(SchemaProducerStartOfProductionPayment, 'Dias de pagamento inválidos')
	.min(1, 'Informe o dia de pagamento')
	.max(2, 'Informe no máximo 2 dias de pagamento');

function refineProducerPaymentDays(
	values: {
		typeOfPayment: z.infer<typeof SchemaProducerTypeOfPayment>;
		startOfPayment: number[];
	},
	ctx: z.RefinementCtx,
) {
	const expected = values.typeOfPayment === 'bi_weekly' ? 2 : 1;

	if (values.startOfPayment.length !== expected) {
		ctx.addIssue({
			code: 'custom',
			path: ['startOfPayment'],
			message:
				expected === 2
					? 'Pagamento quinzenal exige 2 dias de pagamento'
					: 'Informe apenas 1 dia de pagamento',
		});

		return;
	}

	if (new Set(values.startOfPayment).size !== values.startOfPayment.length) {
		ctx.addIssue({
			code: 'custom',
			path: ['startOfPayment'],
			message: 'Os dias de pagamento devem ser diferentes',
		});
	}
}

export {
	SchemaProducerType,
	SchemaProducerAreaOfActivity,
	SchemaProducerTypeOfPayment,
	SchemaProducerStartOfProductionPayment,
	SchemaProducerStartOfProductionPaymentDays,
	refineProducerPaymentDays,
};
