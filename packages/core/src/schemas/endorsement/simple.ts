import { z } from 'zod';
import { SchemaEndorsementType } from './type';

// Por que um endosso não pode (mais) ser revertido. Regras: até 24h depois de
// registrado, só o mais recente ainda não revertido da proposta, e só com os dados
// anteriores guardados (endossos antigos não têm).
const SchemaEndorsementRevertReason = z.enum([
	'reverted',
	'expired',
	'not_latest',
	'no_snapshot',
]);

// O que a reversão devolve: campo da proposta, valor de hoje (`after`) e o valor
// de antes do endosso (`before`), como texto.
const SchemaEndorsementRevertChange = z.object({
	field: z.enum([
		'franchise',
		'overnightPostalCode',
		'plate',
		'driverCPF',
		'driverName',
		'status',
		'canceledAt',
	]),
	before: z.string().nullable(),
	after: z.string().nullable(),
});

const SchemaEndorsementSimple = z.object({
	id: z.uuidv7('ID inválido'),
	type: SchemaEndorsementType,
	effectivedAt: z.coerce.date('Data do endosso inválida'),
	createdAt: z.coerce.date('Data de criação inválida'),
	// Preenchido quando o endosso foi revertido (ele continua na lista).
	revertedAt: z.coerce.date().nullish(),
	revert: z.object({
		canRevert: z.boolean(),
		reason: SchemaEndorsementRevertReason.nullable(),
		// Limite para reverter (registro + 24h).
		until: z.coerce.date(),
		changes: z.array(SchemaEndorsementRevertChange),
	}),
});

export {
	SchemaEndorsementRevertChange,
	SchemaEndorsementRevertReason,
	SchemaEndorsementSimple,
};
