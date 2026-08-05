import { z } from 'zod';
import {
	SchemaBirth,
	SchemaCPF,
	SchemaCPFOrCNPJ,
	SchemaEmail,
	SchemaModality,
	SchemaName,
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '../utils';
import { SchemaSafeStatus } from './status';

const SchemaSafeDetails = z
	.object({
		id: z.uuidv7('ID inválido'),
		producer: z.uuidv7('Produtor inválido').nullish(),
		modality: SchemaModality,
		insuranceCompany: z.uuidv7('ID da seguradora inválida'),
		broker: z.uuidv7('Corretora inválida'),
		status: SchemaSafeStatus,
		insured: z.object(
			{
				registration: SchemaCPFOrCNPJ,
				name: SchemaName,
				birth: SchemaBirth,
				contact: {
					phone: SchemaPhone,
					email: SchemaEmail.nullish(),
				},
			},
			'Segurado inválido',
		),
		vehicle: z.object({
			plate: SchemaPlate.nullish(),
			manufacturer: z.uuidv7('ID do fabricante inválido'),
			model: z
				.string('Modelo inválido')
				.min(1, 'Modelo inválido')
				.trim()
				.toLowerCase(),
			modelYear: z.coerce
				.number('Ano do modelo inválido')
				.positive('Ano do modelo inválido'),
			usage: SchemaVehicleUsage,
			overnightPostalCode: SchemaPostalCode,
		}),
		driver: z.object(
			{
				cpf: SchemaCPF,
				name: SchemaName,
				birth: SchemaBirth,
			},
			'Condutor inválido',
		),
		effectivedAt: z.coerce
			.date('Data de efetivação inválida')
			.or(z.iso.datetime('Data de efetivação inválida')),
		expirationAt: z.coerce
			.date('Data da vigência inválida')
			.or(z.iso.datetime('Data da vigência inválida')),
		requestedAt: z.coerce
			.date('Data de solicitação inválida')
			.or(z.iso.datetime('Data de solicitação inválida')),
		commission: z
			.object({
				franchise: z.number('Frânquia inválida'),
				award: z.number('Prêmio líquido inválido'),
				percentage: z.number('Percentual inválido'),
				commission: z.number('Comissão inválida'),
				installments: z.number('Parcelas inválida'),
			})
			.nullish(),
	})
	.strict();

export { SchemaSafeDetails };
