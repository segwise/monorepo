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

// Segundo dia do pagamento quinzenal: precisa cair de 13 a 17 dias depois
// do primeiro, pra manter o intervalo de uma quinzena.
const SchemaProducerSecondStartOfProductionPayment = z.literal(
	[15, 16, 18, 20, 22, 23, 25, 28, 30],
	'Data de pagamento de comissão inválida',
);

const PRODUCER_FORTNIGHT_GAP = { min: 13, max: 17 } as const;

function getProducerSecondPaymentDays(firstDay?: number) {
	const options = SchemaProducerSecondStartOfProductionPayment.values
		.values()
		.toArray();

	if (!firstDay) {
		return options;
	}

	return options.filter(
		(day) =>
			day - firstDay >= PRODUCER_FORTNIGHT_GAP.min &&
			day - firstDay <= PRODUCER_FORTNIGHT_GAP.max,
	);
}

// Mensal usa 1 dia de pagamento; quinzenal precisa de 2 dias, o segundo
// compatível com uma quinzena depois do primeiro.
const SchemaProducerStartOfProductionPaymentDays = z
	.array(
		z.union([
			SchemaProducerStartOfProductionPayment,
			SchemaProducerSecondStartOfProductionPayment,
		]),
		'Dias de pagamento inválidos',
	)
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
	const [first, second] = values.startOfPayment;

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

	if (!SchemaProducerStartOfProductionPayment.safeParse(first).success) {
		ctx.addIssue({
			code: 'custom',
			path: ['startOfPayment'],
			message: 'Primeiro dia de pagamento inválido',
		});

		return;
	}

	if (
		expected === 2 &&
		!(getProducerSecondPaymentDays(first) as number[]).includes(
			second as number,
		)
	) {
		ctx.addIssue({
			code: 'custom',
			path: ['startOfPayment'],
			message: 'O segundo dia deve ser cerca de uma quinzena após o primeiro',
		});
	}
}

export {
	getProducerSecondPaymentDays,
	refineProducerPaymentDays,
	SchemaProducerAreaOfActivity,
	SchemaProducerSecondStartOfProductionPayment,
	SchemaProducerStartOfProductionPayment,
	SchemaProducerStartOfProductionPaymentDays,
	SchemaProducerType,
	SchemaProducerTypeOfPayment,
};
