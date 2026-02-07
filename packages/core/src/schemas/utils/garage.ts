import z from 'zod';

const SchemaGarage = z.enum(
	['automatic_gate', 'manual_gate', 'private'],
	'Tipo inválido',
);

export { SchemaGarage };
