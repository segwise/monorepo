import z from 'zod';

const SchemaReferral = z
	.string('Código de indicação inválido')
	.min(5, 'Código de indicação inválido')
	.toLowerCase();

const SchemaProducerReferral = z.object({
	referral: SchemaReferral,
});

const SchemaProducerReferralResponse = z.object({
	userId: z.uuidv7('ID inválido'),
	referral: SchemaReferral,
});

export {
	SchemaReferral,
	SchemaProducerReferral,
	SchemaProducerReferralResponse,
};
