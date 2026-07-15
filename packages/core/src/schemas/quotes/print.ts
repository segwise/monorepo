import z from 'zod';

import { SchemaEmail } from '../utils/email';
import { SchemaModality } from '../utils/modality';
import { SchemaName } from '../utils/name';
import { SchemaPhone } from '../utils/phone';
import { SchemaPostalCode } from '../utils/postal-code';
import { SchemaPlate } from '../utils/vehicle/plate';
import { SchemaVehicleUsage } from '../utils/vehicle/usage';
import { SchemaQuoteStatus } from './status';

const SchemaQuotePrint = z.object({
	id: z.uuidv7('ID inválido'),
	renewal: z.boolean('Marcador de renovação inválido').nullish(),
	association: z.boolean('Marcador de associação inválido').nullish(),
	insured: z.object(
		{
			image: z.url('Imagem inválida').nullish(),
			name: SchemaName,
			contact: z.object({
				email: SchemaEmail.nullish(),
				phone: SchemaPhone,
			}),
		},
		'Segurado inválido',
	),
	modality: SchemaModality,
	status: SchemaQuoteStatus,
	insuranceCompany: z.uuidv7('ID da seguradora inválida').nullish(),
	vehicle: z
		.object({
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
			usage: SchemaVehicleUsage,
			overnightPostalCode: SchemaPostalCode,
		})
		.nullish(),
	producer: z.uuidv7('ID do produtor inválido'),
	expiration: z
		.date('Data do final vigência inválida')
		.or(z.iso.datetime('Data do final vigência inválida'))
		.nullish(),
	requestedAt: z.coerce.date('Data de solicitação inválida'),
});

export { SchemaQuotePrint };
