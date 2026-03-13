import z from 'zod';
import { SchemaQuoteStatus } from '@/schemas/quotes/status';
import { SchemaQuoteType } from '@/schemas/quotes/type';
import { SchemaBirth } from '@/schemas/utils/birth';
import { SchemaCPF } from '@/schemas/utils/cpf';
import {
	SchemaGarage,
	SchemaGarageSchool,
	SchemaGarageWork,
} from '@/schemas/utils/garage';
import { SchemaMaritalStatus } from '@/schemas/utils/marital-status';
import { SchemaName } from '@/schemas/utils/name';
import { SchemaPhone } from '@/schemas/utils/phone';
import { SchemaPostalCode } from '@/schemas/utils/postal-code';
import { SchemaQualificationTime } from '@/schemas/utils/qualification-time';
import { SchemaResidence } from '@/schemas/utils/residence';
import { SchemaVehicleExchange } from '@/schemas/utils/vehicle';
import { SchemaPlate } from '@/schemas/utils/vehicle/plate';
import { SchemaVehicleUsage } from '@/schemas/utils/vehicle/usage';

const SchemaQuoteRegister = z
	.object({
		producer: z.uuidv7('Produtor inválido').nullish(),
		type: SchemaQuoteType,
		renewal: z.boolean('Marcador de renovação inválido'),
		status: SchemaQuoteStatus,
		requestAt: z.coerce.date('Data da solicitação inválida'),
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
					modelYear: z.coerce
						.number('Ano do modelo inválido')
						.positive('Ano do modelo inválido'),
					chassi: z.string('Chassi inválido').nullish(),
					usage: SchemaVehicleUsage,
					exchange: SchemaVehicleExchange,
					overnightPostalCode: SchemaPostalCode,
					additional: z.object(
						{
							residence: z.object(
								{
									type: SchemaResidence,
									garage: SchemaGarage,
								},
								'Residência inválido',
							),
							work: SchemaGarageWork,
							school: SchemaGarageSchool,
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
		driver: z.object(
			{
				name: SchemaName,
				cpf: SchemaCPF,
				birth: SchemaBirth,
				phone: SchemaPhone,
			},
			'Condutor inválido',
		),
	})
	.refine(({ type, vehicle }) => (type === 'car' ? !!vehicle : true));

export { SchemaQuoteRegister };
