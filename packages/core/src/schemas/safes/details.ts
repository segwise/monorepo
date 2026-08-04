import { z } from 'zod';
import {
	SchemaBirth,
	SchemaCPF,
	SchemaCPFOrCNPJ,
	SchemaModality,
	SchemaName,
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '../utils';

const SchemaSafeDetails = z
	.object({
		id: z.uuidv7('ID inválido'),
		modality: SchemaModality,
		insuranceCompany: z.uuidv7('ID da seguradora inválida'),
		effectivedAt: z.coerce
			.date('Data de efetivação inválida')
			.or(z.iso.datetime('Data de efetivação inválida')),
		expirationAt: z.coerce
			.date('Data da vigência inválida')
			.or(z.iso.datetime('Data da vigência inválida')),
		insured: z.object(
			{
				phone: SchemaPhone,
				registration: SchemaCPFOrCNPJ,
				name: SchemaName,
				birth: SchemaBirth,
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
	})
	.strict();

export { SchemaSafeDetails };
