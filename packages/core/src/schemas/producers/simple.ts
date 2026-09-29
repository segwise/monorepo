import z from 'zod';

import { SchemaCNPJ } from '../utils/cnpj';
import { SchemaCPF } from '../utils/cpf';
import { SchemaEmail } from '../utils/email';
import { SchemaName } from '../utils/name';
import { SchemaPhone } from '../utils/phone';
import { SchemaReferral } from './referral';
import {
	SchemaProducerStartOfProductionPayment,
	SchemaProducerType,
	SchemaProducerTypeOfPayment,
} from './type';

const SchemaProducerSimple = z.object({
	id: z.uuidv7('ID do produtor inválido'),
	name: SchemaName,
	avatar: z.url('Avatar inválido').nullish(),
	cpf: SchemaCPF.nullish(),
	cnpj: SchemaCNPJ.nullish(),
	contact: z.object({
		email: SchemaEmail,
		phone: SchemaPhone.nullish(),
	}),
	referral: SchemaReferral,
	typeOfProduction: SchemaProducerType,
	typeOfProductionPayment: SchemaProducerTypeOfPayment,
	percentageOfProduction: z.coerce
		.number('Percentual de comissão inválido')
		.min(1, 'Percentual de comissão inválido')
		.max(100, 'Percentual de comissão inválido'),
	startOfProductionPayment: SchemaProducerStartOfProductionPayment,
	memberSince: z.coerce
		.date('Data de início inválida')
		.or(z.iso.datetime('Data de início inválida')),
	pix: z.string('Chave PIX inválida').nullish(),
});

export { SchemaProducerSimple };
