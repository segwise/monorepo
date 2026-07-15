import z from 'zod';

import { SchemaBirth } from '../../utils/birth';
import { SchemaCPF } from '../../utils/cpf';
import {
	SchemaGarage,
	SchemaGarageSchool,
	SchemaGarageWork,
} from '../../utils/garage';
import { SchemaMaritalStatus } from '../../utils/marital-status';
import { SchemaModality } from '../../utils/modality';
import { SchemaName } from '../../utils/name';
import { SchemaPhone } from '../../utils/phone';
import { SchemaPostalCode } from '../../utils/postal-code';
import { SchemaQualificationTime } from '../../utils/qualification-time';
import { SchemaResidence } from '../../utils/residence';
import { SchemaVehicleExchange } from '../../utils/vehicle';
import { SchemaPlate } from '../../utils/vehicle/plate';
import { SchemaVehicleUsage } from '../../utils/vehicle/usage';
import { SchemaQuoteStatus } from '../status';

const SchemaQuoteRegister = z
	.object({
		producer: z.uuidv7('Produtor inválido').nullish(),
		modality: SchemaModality,
		renewal: z.boolean('Marcador de renovação inválido'),
		status: SchemaQuoteStatus,
		requestedAt: z.coerce.date('Data da solicitação inválida'),
		insuranceCompany: z.uuidv7('Seguradora inválida').nullish(),
		expiration: z.coerce.date('Vigência inválida').nullish(),
		insured: z.object(
			{
				name: SchemaName,
				cpf: SchemaCPF,
				birth: SchemaBirth,
				phone: SchemaPhone,
				maritalStatus: SchemaMaritalStatus,
				qualificationTime: SchemaQualificationTime.nullish(),
			},
			'Segurado inválido',
		),
		vehicle: z
			.object(
				{
					plate: SchemaPlate.nullish(),
					manufacturer: z.uuidv7('ID do fabricante inválido'),
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
							armored: z.boolean('Marcado de blindado inválido'),
							gasKit: z.boolean('Marcado de kit gás inválido'),
							theInsuredIsTheOwner: z.boolean(
								'Marcado de propriedade do veículo inválida',
							),
							funded: z.boolean('Marcador de financiamento inválido'),
							driversUnder26: z.boolean(
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
			},
			'Condutor inválido',
		),
	})
	.refine(
		({ renewal, insuranceCompany }) => {
			if (renewal) {
				return !!insuranceCompany;
			}
			return true;
		},
		{
			path: ['insuranceCompany'],
			error: 'Seguradora inválida',
		},
	)
	.refine(
		({ renewal, expiration }) => {
			if (renewal) {
				return !!expiration;
			}
			return true;
		},
		{
			path: ['expiration'],
			error: 'Vigência inválida',
		},
	)
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
		({ modality, insured }) => {
			if (modality !== 'vehicle') {
				return true;
			}
			return !!insured?.qualificationTime;
		},
		{
			path: ['insured', 'qualificationTime'],
			error: 'Tempo de habilitação inválida',
		},
	);

export { SchemaQuoteRegister };
