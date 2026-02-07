import z from 'zod';

const SchemaVehicleUsage = z.enum(
	[
		'leisure_and_commuting',
		'leisure',
		'client_supplier_visits',
		'app_based_transport',
		'taxi',
		'shared_van',
		'delivieries',
	],
	'Uso inválido',
);

export { SchemaVehicleUsage };
