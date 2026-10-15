import z from 'zod';

const SchemaPaymentStatus = z.enum(
	['waiting', 'paid', 'expired', 'canceled'],
	'Status inválido',
);

export { SchemaPaymentStatus };
