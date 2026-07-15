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

const SchemaProducerTypeOfPayment = z.enum(
	['weekly', 'bi_weekly', 'monthly'],
	'Tipo de pagamento inválido',
);

const SchemaProducerStartOfProductionPayment = z.literal(
	[1, 3, 5, 8, 10, 15],
	'Data de pagamento de comissão inválida',
);

export {
	SchemaProducerType,
	SchemaProducerTypeOfPayment,
	SchemaProducerStartOfProductionPayment,
};
