import z from 'zod';

const SchemaPaymentMethod = z.enum(
	['pix', 'billet', 'transfer', 'species', 'credit_card'],
	'Método de pagamento inválido',
);

export { SchemaPaymentMethod };
