import z from 'zod';

import { SchemaModality, SchemaPostalCode, SchemaVehicleUsage } from '../utils';
import { SchemaEmail } from '../utils/email';
import { SchemaName } from '../utils/name';
import { SchemaPhone } from '../utils/phone';
import { SchemaPlate } from '../utils/vehicle/plate';
import { SchemaSafeStatus } from './status';

const SchemaSafeSimple = z.object({
	id: z.uuidv7('ID inválido'),
	producer: z.uuidv7('ID do produtor inválido').nullish(),
	renewal: z.boolean('Marcador de renovação inválido').nullish(),
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
	status: SchemaSafeStatus,
	insuranceCompany: z.uuidv7('ID da seguradora inválida').nullish(),
	broker: z.uuidv7('ID da corretora inválida'),
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
			driver: z
				.object({
					name: SchemaName,
				})
				.nullish(),
		})
		.nullish(),
	franchise: z.number('Frânquia inválida').nullish(),
	expiration: z.iso
		.datetime('Vigência inválida')
		.or(z.date('Vigência inválida')),
	requestedAt: z.coerce
		.date('Data de solicitação inválida')
		.or(z.iso.datetime('Data de solicitação inválida')),
	effectivedAt: z.coerce
		.date('Data de efetivação inválida')
		.or(z.iso.datetime('Data de efetivação inválida'))
		.nullish(),
});

export { SchemaSafeSimple };
