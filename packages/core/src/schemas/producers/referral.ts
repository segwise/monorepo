import z from 'zod';

// O código é digitado à mão (admin e link público) e vira link/código no app:
// só letras e números, sem espaço nem acento.
const SchemaReferral = z
	.string('Código de indicação inválido')
	.trim()
	.toLowerCase()
	.regex(
		/^[a-z0-9]{3,20}$/,
		'Código de indicação inválido: use de 3 a 20 letras e números, sem espaços',
	);

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
