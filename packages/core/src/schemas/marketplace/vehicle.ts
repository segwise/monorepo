import z from 'zod';
import { SchemaPlate } from '../utils';

const SchemaMarketplaceVehicle = z
	.object({
		id: z.uuidv7('ID do anúncio inválido'),
		photo: z.url('Imagem inválida'),
		gallery: z.array(z.url('Imagem inválida'), 'Galeria inválida'),
		model: z.string('Modelo inválido'),
		year: z.coerce.number('Ano inválido'),
		price: z.coerce.number('Valor do veículo inválido'),
		mileage: z.coerce.number('Kilometragem inválida'),
		color: z.string('Cor do veículo inválida'),
		neighborhood: z.string('Bairro inválid').nullish(),
		city: z.string('Cidade inválida'),
		state: z.string('Estado inválido'),
		status: z.enum(['active', 'sold', 'paused'], 'Status inválido'),
		plate: SchemaPlate,
		createdAt: z.coerce.date('Data de registro inválida'),
		acceptExchange: z.boolean().nullish(),
		acceptExchangeAmount: z.enum(['down', 'up']).nullish(),
		acceptExchangeChange1: z.string().nullish(),
		acceptExchangeChange2: z.string().nullish(),
		acceptExchangeChange3: z.string().nullish(),
	})
	.strict();

const SchemaMarketplaceVehicleFinancialState = z.enum(
	['financed', 'settled'],
	'Estado financeiro inválido',
);

const SchemaMarketplaceVehicleConservations = z.enum(
	['only_owner', 'with_manual', 'extra_key', 'reviewed', 'with_guarantee'],
	'Conservação inválida',
);

const SchemaMarketplaceVehicleFeatures = z.enum(
	[
		'air_barg',
		'alarm',
		'air_conditioning',
		'electric_locks',
		'electric_windows',
		'sound',
		'reverse_sensor',
		'reversing_camera',
	],
	'Opcional inválido',
);

const SchemaMarketplaceVehicleDirection = z.enum(
	['hydraulics', 'electric', 'mechanics', 'assisted'],
	'Direção inválida',
);

const SchemaMarketplaceVehicleFuel = z.enum(
	['gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid'],
	'Combustível inválido',
);

const SchemaMarketplaceVehicleTransmission = z.enum(
	['manual', 'automatic', 'cvt', 'automated_manual'],
	'Transmissão inválida',
);

const SchemaMarketplaceVehicleStatus = z.enum(
	['active', 'sold', 'paused'],
	'Status inválido',
);

const SchemaSelectOption = z.object({
	value: z.string(),
	label: z.string(),
});

const currentYear = new Date().getFullYear();

const SchemaMarketplaceVehicleRegisterForm = z.object({
	photos: z
		.array(
			z
				.url('URL de foto inválida')
				.or(
					z
						.file('Imagem inválida')
						.mime(['image/jpeg', 'image/png', 'image/webp']),
				),
		)
		.min(1, 'Mínimo 1 foto')
		.max(10, 'Máximo de 10 fotos permitidas')
		.default([]),
	model: z
		.string('Informe o modelo do veículo')
		.min(2, 'Modelo deve ter ao menos 2 caracteres')
		.max(80, 'Modelo muito longo')
		.transform((v) => v.trim().toUpperCase()),
	year: z
		.string('Informe o ano do veículo')
		.regex(/^\d{4}$/, 'Ano inválido')
		.or(z.coerce.number('Ano inválido'))
		.refine(
			(v) => {
				const year = Number(v);
				return year >= 1950 && year <= currentYear + 1;
			},
			{ message: `Ano deve estar entre 1950 e ${currentYear + 1}` },
		)
		.transform((value) => Number(value)),
	plate: SchemaPlate,
	color: z
		.string('Informe a cor do veículo')
		.min(2, 'Cor deve ter ao menos 2 caracteres')
		.max(30, 'Cor muito longa')
		.transform((v) => v.trim().toUpperCase()),
	fuel: SchemaSelectOption.refine(
		(v) => SchemaMarketplaceVehicleFuel.safeParse(v.value).success,
		{ message: 'Selecione o tipo de combustível' },
	).or(SchemaMarketplaceVehicleFuel),
	transmission: SchemaSelectOption.refine(
		(v) => SchemaMarketplaceVehicleTransmission.safeParse(v.value).success,
		{ message: 'Selecione o tipo de câmbio' },
	).or(SchemaMarketplaceVehicleTransmission),
	state: SchemaSelectOption.refine((v) => !!v.value, 'Selecione o Estado').or(
		z.string('Informe o Estado'),
	),
	city: SchemaSelectOption.refine((v) => !!v.value, 'Selecione a Cidade').or(
		z.string('Informe a Cidade'),
	),
	price: z.coerce
		.number('Informe o preço de venda')
		.positive('O preço deve ser maior que zero'),
	mileage: z.coerce
		.number('Informe a quilometragem')
		.min(0, 'Quilometragem não pode ser negativa')
		.max(999_999, 'Quilometragem inválida'),
	description: z
		.string()
		.max(1000, 'Descrição deve ter no máximo 1000 caracteres')
		.nullish()
		.transform((v) => v?.trim() ?? null),
});

const SchemaMarketplaceVehicleEditForm =
	SchemaMarketplaceVehicleRegisterForm.extend({
		id: z.uuidv7('ID do veículo é obrigatório'),
	});

export {
	SchemaMarketplaceVehicle,
	SchemaMarketplaceVehicleFuel,
	SchemaMarketplaceVehicleTransmission,
	SchemaMarketplaceVehicleStatus,
	SchemaMarketplaceVehicleEditForm,
	SchemaMarketplaceVehicleRegisterForm,
	SchemaMarketplaceVehicleDirection,
	SchemaMarketplaceVehicleFeatures,
	SchemaMarketplaceVehicleConservations,
	SchemaMarketplaceVehicleFinancialState,
};
