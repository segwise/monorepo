import z from 'zod';

const SchemaVehicleExchange = z.enum(
	['manual', 'automatic'],
	'Câmbio inválido',
);

export { SchemaVehicleExchange };
