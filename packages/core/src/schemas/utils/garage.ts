import z from 'zod';

const SchemaGarage = z.enum(
	['automatic_gate', 'manual_gate', 'private', 'no_garage'],
	'Tipo inválido',
);

export { SchemaGarage };
