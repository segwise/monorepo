import { differenceInYears } from 'date-fns';
import z from 'zod';
import { getNumericValue } from '../../../utils/get-numeric-value-money';
import { isCPF } from '../../../valids';
import { SchemaBirthNoValidation, SchemaCPFOrCNPJ } from '../../utils';
import { SchemaModality } from '../../utils/modality';
import { SchemaName } from '../../utils/name';
import { SchemaPhone } from '../../utils/phone';
import { SchemaPostalCode } from '../../utils/postal-code';
import { SchemaVehicleExchange } from '../../utils/vehicle';
import { SchemaPlate } from '../../utils/vehicle/plate';
import { SchemaVehicleUsage } from '../../utils/vehicle/usage';
import { SchemaSafeStatus } from '../status';

const SchemaSafeCommission = z
	.object(
		{
			type: z.enum(
				['by_the_brokerage_commission', 'by_the_net_premium', 'fixed_value'],
				'Tipo de comissão inválido',
			),
			percentage: z.coerce
				.number('Percentual de comissão inválido')
				.min(1, 'Percentual de comissão inválido')
				.max(100, 'Percentual de comissão inválido'),
			discountPercentage: z.coerce
				.number('Disconto de comissão inválido')
				.min(1, 'Disconto de comissão inválido')
				.max(100, 'Percentual de comissão inválido')
				.nullish(),
			discountFixed: z
				.string('Disconto de comissão inválido')
				.transform(getNumericValue)
				.or(
					z.coerce
						.number('Disconto de comissão inválido')
						.min(1, 'Disconto de comissão inválido'),
				)
				.refine((value) => value > 0, 'Disconto de comissão inválido')
				.nullish(),
			installments: z.coerce
				.number('Parcelas de comissão inválida')
				.min(1, 'Parcelas de comissão inválida'),
			monthlyInterest: z.coerce
				.number('Juros ao mês inválido')
				.min(1, 'Juros ao mês inválido')
				.nullish(),
			payInterestStarting: z.coerce
				.number('Mês de pagamento de juros inválido')
				.min(1, 'Mês de pagamento de juros inválido')
				.max(12, 'Mês de pagamento de juros inválido')
				.nullish(),
			typeOfInterest: z
				.enum(['simple', 'compound'], 'Tipo de juros inválido')
				.nullish(),
			paymentDate: z.coerce
				.date('Data de efetivação inválida')
				.or(z.iso.datetime('Data de efetivação inválida')),
		},
		'Comissões inválidas',
	)
	.refine(
		({ monthlyInterest, payInterestStarting }) => {
			if (monthlyInterest) {
				return !!payInterestStarting;
			}
			return true;
		},
		{
			path: ['payInterestStarting'],
			error: 'Mês de pagamento de juros inválido',
		},
	)
	.refine(
		({ monthlyInterest, typeOfInterest }) => {
			if (monthlyInterest) {
				return !!typeOfInterest;
			}
			return true;
		},
		{
			path: ['typeOfInterest'],
			error: 'Tipo de juros inválido',
		},
	);

const SchemaSafeRegister = z
	.object({
		producer: z.uuidv7('Produtor inválido').nullish(),
		modality: SchemaModality,
		renewal: z.boolean('Marcador de renovação inválido'),
		previousSafe: z.uuidv7('Produtor inválido').nullish(),
		status: SchemaSafeStatus,
		requestedAt: z.coerce
			.date('Data de solicitação inválida')
			.or(z.iso.datetime('Data de solicitação inválida')),
		effectivedAt: z.coerce
			.date('Data de efetivação inválida')
			.or(z.iso.datetime('Data de efetivação inválida'))
			.nullish(),
		insuranceCompany: z.uuidv7('Seguradora inválida'),
		insured: z
			.object(
				{
					name: SchemaName,
					registration: SchemaCPFOrCNPJ,
					birth: SchemaBirthNoValidation,
					phone: SchemaPhone,
					profession: z.string('Profissão inválida').nullish(),
				},
				'Segurado inválido',
			)
			.refine(
				({ registration, birth }) =>
					!isCPF(registration) || differenceInYears(new Date(), birth) >= 18,
				'Não pode ser menor de 18 anos',
			),
		vehicle: z
			.object(
				{
					plate: SchemaPlate.nullish(),
					manufacturer: z.uuidv7('ID do fabricante inválido').nullish(),
					model: z
						.string('Modelo inválido')
						.min(1, 'Modelo inválido')
						.trim()
						.toLowerCase(),
					modelYear: z.coerce
						.number('Ano do modelo inválido')
						.positive('Ano do modelo inválido'),
					chassi: z.string('Chassi inválido').nullish(),
					usage: SchemaVehicleUsage,
					exchange: SchemaVehicleExchange.nullish(),
					overnightPostalCode: SchemaPostalCode,
				},
				'Veículo inválido',
			)
			.nullish(),
		driver: z
			.object(
				{
					name: SchemaName,
					registration: SchemaCPFOrCNPJ,
					birth: SchemaBirthNoValidation,
				},
				'Condutor inválido',
			)
			.refine(
				({ registration, birth }) =>
					!isCPF(registration) || differenceInYears(new Date(), birth) >= 18,
				'Não pode ser menor de 18 anos',
			),
		receivables: z.object({
			installments: z.coerce
				.number('Parcelas inválidas')
				.min(1, 'Mínimo 1 parcela')
				.max(12, 'Máximo 12 parcelas'),
			award: z
				.string('Prêmio líquido inválido')
				.transform(getNumericValue)
				.or(
					z.coerce
						.number('Prêmio líquido inválido')
						.min(1, 'Prêmio líquido inválido'),
				)
				.refine((value) => value > 0, 'Prêmio líquido inválido'),
			franchise: z
				.string('Frânquia inválido')
				.transform(getNumericValue)
				.or(z.coerce.number('Frânquia inválido').min(0, 'Frânquia inválido'))
				.nullish(),
			// .or(z.coerce.number('Frânquia inválido').min(1, 'Frânquia inválido')),
			// .refine((value) => value > 0, 'Frânquia inválido'),
			commission: z.coerce
				.number('Percentual de comissão inválidas')
				.min(1, 'Percentual de comissão inválidas')
				.max(100, 'Percentual de comissão inválidas'),
		}),
		commissions: SchemaSafeCommission.nullish(),
	})
	.refine(
		({ modality, vehicle }) => {
			if (modality === 'vehicle') {
				return !!vehicle;
			}
			return true;
		},
		{
			path: ['vehicle'],
			error: 'Veículo inválido',
		},
	)
	.refine(
		({ producer, commissions }) => {
			if (producer) {
				return !!commissions;
			}
			return true;
		},
		{
			path: ['commissions'],
			error: 'Comissões inválidas',
		},
	)
	.refine(
		({ commissions }) => {
			if (commissions?.monthlyInterest) {
				return !!commissions.payInterestStarting;
			}
			return true;
		},
		{
			path: ['payInterestStarting'],
			error: 'Mês de pagamento de juros inválido',
		},
	)
	.refine(
		({ commissions }) => {
			if (commissions?.monthlyInterest) {
				return !!commissions.typeOfInterest;
			}
			return true;
		},
		{
			path: ['typeOfInterest'],
			error: 'Tipo de juros inválido',
		},
	);

export { SchemaSafeRegister, SchemaSafeCommission };
