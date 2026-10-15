import z from 'zod';

const SchemaVehicleUsage = z.enum(
	[
		'leisure_and_work',
		'leisure',
		'client_supplier_visits',
		'app_based_transport',
		'taxi',
		'public_transportation',
		'delivieries',
		'tourism',
	],
	'Utilização inválida',
);

export { SchemaVehicleUsage };
