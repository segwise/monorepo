import z from 'zod';

const SchemaGarage = z.enum(
	['automatic_gate', 'manual_gate', 'private', 'no_garage'],
	'Tipo inválido',
);

const SchemaGarageWork = z.enum(
	['yes', 'no', 'does_not_work', 'does_not_use'],
	'Tipo inválido',
);

const SchemaGarageSchool = z.enum(
	['yes', 'no', 'does_not_study', 'does_not_use'],
	'Tipo inválido',
);

export { SchemaGarage, SchemaGarageWork, SchemaGarageSchool };
