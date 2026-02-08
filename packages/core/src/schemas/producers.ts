import z from 'zod';

import { SchemaName } from '@/schemas/utils/name';
import { SchemaPhone } from '@/schemas/utils/phone';

const SchemaProducerSimple = z.object({
	id: z.uuidv7('ID do produtor inválido'),
	name: SchemaName,
	avatar: z.url('Avatar inválido').nullish(),
	contact: z.object({
		email: z.email('E-mail inválido'),
		phone: SchemaPhone,
	}),
});

export { SchemaProducerSimple };
