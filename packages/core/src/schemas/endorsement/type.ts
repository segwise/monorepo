import { z } from 'zod';

const SchemaEndorsementType = z.enum([
	'vehicle_conductor',
	'address',
	'franchise',
	'cancellation',
]);

export { SchemaEndorsementType };
