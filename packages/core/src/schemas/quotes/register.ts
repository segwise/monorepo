import z from 'zod';
import { SchemaQuoteStatus } from '@/schemas/quotes/status';
import { SchemaQuoteType } from '@/schemas/quotes/type';
import { SchemaBirth } from '@/schemas/utils/birth';
import { SchemaCPF } from '@/schemas/utils/cpf';
import { SchemaGarage } from '@/schemas/utils/garage';
import { SchemaMaritalStatus } from '@/schemas/utils/marital-status';
import { SchemaName } from '@/schemas/utils/name';
import { SchemaPhone } from '@/schemas/utils/phone';
import { SchemaPostalCode } from '@/schemas/utils/postal-code';
import { SchemaQualificationTime } from '@/schemas/utils/qualification-time';
import { SchemaResidence } from '@/schemas/utils/residence';
import { SchemaVehicleExchange } from '@/schemas/utils/vehicle';
import { SchemaPlate } from '@/schemas/utils/vehicle/plate';
import { SchemaVehicleUsage } from '@/schemas/utils/vehicle/use';

const SchemaQuoteRegister = z
	.object({
		producer: z.uuidv7('Produtor inválido').nullish(),
		type: SchemaQuoteType,
		renewal: z.boolean('Marcador de renovação inválido'),
		status: SchemaQuoteStatus,
		statusAt: z.coerce.date('Data de alteração de status inválida'),
		statusMessage: z
			.string('Mensagem de status inválido')
			.trim()
			.toLowerCase()
			.nullish(),
		requestAt: z.coerce.date('Data de solicitação inválida'),
		insured: z.object(
			{
				name: SchemaName,
				cpf: SchemaCPF,
				birth: SchemaBirth,
				phone: SchemaPhone,
				maritalStatus: SchemaMaritalStatus,
				qualificationTime: SchemaQualificationTime,
				profession: z
					.string('Profissão inválida')
					.min(4, 'Profissão inválida')
					.trim()
					.toLowerCase()
					.nullish(),
				// profession: z.uuidv7('Profissão inválida').nullish(),
			},
			'Segurado inválido',
		),
		vehicle: z
			.object(
				{
					plate: SchemaPlate.nullish(),
					manufacturer: z
						.string('Fabricante inválido')
						.min(1, 'Fabricante inválido')
						.trim()
						.toLowerCase(),
					model: z
						.string('Modelo inválido')
						.min(1, 'Modelo inválido')
						.trim()
						.toLowerCase(),
					yearOfManufacture: z.coerce
						.number('Ano de fabricação inválida')
						.positive(),
					modelYear: z.coerce.number('Ano do modelo inválido'),
					chassi: z.string('Chassi inválido').nullish(),
					use: SchemaVehicleUsage,
					exchange: SchemaVehicleExchange,
					overnightPostalCode: SchemaPostalCode,
					additional: z.object(
						{
							residence: z.object(
								{
									type: SchemaResidence,
									garage: SchemaGarage.nullish(),
								},
								'Residência inválido',
							),
							work: z.object(
								{
									active: z.coerce.boolean('Marcador de trabalhador inválido'),
									garage: SchemaGarage.nullish(),
								},
								'Trabalho inválido',
							),
							school: z.object(
								{
									active: z.coerce.boolean('Marcador de estudante inválido'),
									garage: SchemaGarage.nullish(),
								},
								'Escola inválida',
							),
							armored: z.coerce.boolean('Marcado de blindado inválido'),
							gasKit: z.coerce.boolean('Marcado de kit gás inválido'),
							theInsuredIsTheOwner: z.coerce.boolean(
								'Marcado de propriedade do veículo inválida',
							),
							funded: z.coerce.boolean('Marcador de financiamento inválido'),
							driversUnder26: z.coerce.boolean(
								'Marcar de menores condutores inválido',
							),
						},
						'Dados adicionais inválido',
					),
				},
				'Veículo inválido',
			)
			.nullish(),
		driver: z.literal(true, 'Condutor inválido').or(
			z.object(
				{
					name: SchemaName,
					cpf: SchemaCPF,
					birth: SchemaBirth,
					phone: SchemaPhone,
				},
				'Condutor inválido',
			),
		),
	})
	.refine(({ type, vehicle }) => (type === 'car' ? !!vehicle : true));

export { SchemaQuoteRegister };
