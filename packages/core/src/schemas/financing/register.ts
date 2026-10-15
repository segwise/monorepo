import z from 'zod';
import { SchemaReferral } from '../producers';
import { SchemaCPF, SchemaName, SchemaPhone, SchemaPlate } from '../utils';

const SchemaQuoteFinancingRegister = z
	.object({
		referral: SchemaReferral.nullish(),
		vehicle: z
			.object({
				plate: SchemaPlate.nullish(),
				model: z
					.string('Modelo inválido')
					.min(1, 'Modelo inválido')
					.trim()
					.toLowerCase(),
				year: z.coerce
					.number('Ano do modelo inválido')
					.positive('Ano do modelo inválido'),
				amount: z.coerce
					.number('Valor do veículo inválido')
					.positive('Valor do veículo inválido'),
				downPayment: z.coerce
					.number('Valor de entrada inválido')
					.positive('Valor de entrada inválido')
					.nullish(),
			})
			.strict(),
		financed: z
			.object({
				name: SchemaName,
				phone: SchemaPhone,
				cpf: SchemaCPF,
			})
			.strict(),
	})
	.strict();

export { SchemaQuoteFinancingRegister };
