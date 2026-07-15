import z from 'zod';
import { getNumericValueMoney } from '../../utils/get-numeric-value-money';
import {
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleExchange,
} from '../utils';
import {
	SchemaMarketplaceVehicleConservations,
	SchemaMarketplaceVehicleDirection,
	SchemaMarketplaceVehicleFeatures,
	SchemaMarketplaceVehicleFinancialState,
	SchemaMarketplaceVehicleFuel,
} from './vehicle';

const SchemaMarketplaceRegister = z.object({
	insured: z.uuidv7('ID do segurado inválido'),
	images: z
		.array(
			z
				.file('Imagem inválida')
				.mime(['image/webp', 'image/png', 'image/jpeg'], 'Imagem inválida')
				.or(
					z.object({
						uri: z.url('URI inválido'),
						fileName: z.string('Nome do arquivo inválido'),
						mimeType: z.string('Tipo de arquivo inválido'),
					}),
				)
				.or(z.url('URL inválida')),
		)
		.min(1, 'Mínimo 1 imagem')
		.or(
			z
				.file('Imagem inválida')
				.mime(['image/webp', 'image/png', 'image/jpeg'], 'Imagem inválida')
				.or(
					z.object({
						uri: z.url('URI inválido'),
						fileName: z.string('Nome do arquivo inválido'),
						mimeType: z.string('Tipo de arquivo inválido'),
					}),
				),
		)
		.or(z.url('URL inválida'))
		.transform((value) => (Array.isArray(value) ? value : [value])),
	plate: SchemaPlate,
	postalCode: SchemaPostalCode,
	manufacturer: z.string('Fabricante inválida').min(1, 'Fabricante inválida'),
	phone: SchemaPhone,
	type: z.enum(['car', 'motorcycle']),
	model: z.string('Modelo inválido').min(1, 'Modelo inválido'),
	modelYear: z.coerce
		.number('Ano do modelo inválido')
		.refine((value) => value > 1950, 'Ano do modelo inválido'),
	exchange: SchemaVehicleExchange,
	fuel: SchemaMarketplaceVehicleFuel,
	direction: SchemaMarketplaceVehicleDirection,
	km: z.coerce.number('Kilometragem inválida').min(0, 'Kilometragem inválida'),
	optionals: z
		.array(SchemaMarketplaceVehicleFeatures, 'Opcionais inválido')
		.or(SchemaMarketplaceVehicleFeatures)
		.default([])
		.transform((value) => (Array.isArray(value) ? value : [value]))
		.nullable(),
	conservations: z
		.array(SchemaMarketplaceVehicleConservations, 'Conservações inválidas')
		.or(SchemaMarketplaceVehicleConservations)
		.default([])
		.transform((value) => (Array.isArray(value) ? value : [value]))
		.nullable(),
	color: z.string('Cor inválida').min(1, 'Cor inválida').toLowerCase(),
	financialState: SchemaMarketplaceVehicleFinancialState,
	description: z.string('Descrição inválida'),
	price: z.coerce
		.number('Preço inválido')
		.min(1, 'Preço inválido')
		.or(z.string('Preço inválido').transform(getNumericValueMoney))
		.refine((value) => value > 0, 'Preço inválido'),
	acceptExchange: z
		.literal(['true', 'false'])
		.transform((value) => value === 'true')
		.or(z.boolean('Campo inválido'))
		.nullish(),
	acceptExchangeAmount: z.enum(['down', 'up'], 'Campo inválido').nullish(),
	acceptExchangeChange1: z
		.string('Campo inválido')
		.min(1, 'Campo inválido')
		.nullish(),
	acceptExchangeChange2: z
		.string('Campo inválido')
		.min(1, 'Campo inválido')
		.nullish(),
	acceptExchangeChange3: z
		.string('Campo inválido')
		.min(1, 'Campo inválido')
		.nullish(),
});

export { SchemaMarketplaceRegister };
