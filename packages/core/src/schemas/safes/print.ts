import z from 'zod';

import { SchemaPostalCode, SchemaVehicleUsage } from '../utils';
import { SchemaEmail } from '../utils/email';
import { SchemaName } from '../utils/name';
import { SchemaPhone } from '../utils/phone';
import { SchemaPlate } from '../utils/vehicle/plate';

const SchemaSafePrint = z.object({
	id: z.uuidv7('ID inválido'),
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
	insuranceCompany: z.uuidv7('ID da seguradora inválida').nullish(),
	expiration: z.iso
		.datetime('Vigência inválida')
		.or(z.date('Vigência inválida')),
	franchise: z.coerce.number('Frânquia inválido').nullish(),
});

export { SchemaSafePrint };
