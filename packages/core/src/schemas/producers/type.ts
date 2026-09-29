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

export {
	SchemaProducerType,
	SchemaProducerAreaOfActivity,
	SchemaProducerTypeOfPayment,
	SchemaProducerStartOfProductionPayment,
};
