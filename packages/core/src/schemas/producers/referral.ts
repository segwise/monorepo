import z from 'zod';

const SchemaReferral = z.string('Código inválido').min(5, 'Código inválido');

const SchemaProducerReferral = z.object({
	referral: SchemaReferral,
});

const SchemaProducerReferralResponse = z.object({
	userId: z.uuidv7('ID inválido'),
	referral: SchemaReferral,
});

export { SchemaProducerReferral, SchemaProducerReferralResponse };
