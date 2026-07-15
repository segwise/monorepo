import z from 'zod';

import { SchemaQuoteStatus } from '@/schemas/quotes/status';
import { SchemaEmail } from '@/schemas/utils/email';
import { SchemaName } from '@/schemas/utils/name';
import { SchemaPhone } from '@/schemas/utils/phone';
import { SchemaPlate } from '@/schemas/utils/vehicle/plate';
import { SchemaModality } from '../utils';

const SchemaQuoteSimple = z.object({
	id: z.uuidv7('ID inválido'),
	renewal: z.boolean('Marcador de renovação inválido'),
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
	vehicle: z
		.object({
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
		})
		.nullish(),
	requestAt: z.coerce.date('Data de solicitação inválida'),
});

export { SchemaQuoteSimple };
