import {
	SchemaName,
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '@segwise/core/schemas';
import { isDateString } from '@segwise/core/valids';
import { startOfDay } from 'date-fns';
import z from 'zod';

const SchemaQuoteSimpleSubmit = z
	.object({
		vehicleWithLicensePlate: z.coerce.boolean(),
		plate: SchemaPlate.nullish(),
		use: z.object({
			label: z.string(),
			value: SchemaVehicleUsage,
		}),
		postalCode: SchemaPostalCode,
		insured: z.object({
			name: SchemaName,
			phone: SchemaPhone,
		}),
		renewal: z.object({
			label: z.string(),
			value: z.enum(['new', 'renewal']),
		}),
		insuranceCompany: z
			.object(
				{
					label: z.string(),
					value: z.uuidv7('Seguradora inválida'),
				},
				'Seguradora inválida',
			)
			.nullish(),
		expiration: z
			.string()
			.refine(isDateString, 'Vigência inválida')
			.transform((value) => {
				const splits = value.split('/').flatMap((value) => Number(value));

				const day = splits[0];
				const month = splits[1] - 1;
				const year = splits[2];

				return new Date(year, month, day);
			})
			.refine(
				(value) => startOfDay(new Date()) < startOfDay(value),
				'Vigência não pode ser retroativa',
			)
			.nullish(),
		franchise: z.coerce.number('Frânquia inválido').nullish(),
	})
	.transform((props) => ({ ...props, use: props.use.value }))
	.transform(
		({
			plate,
			renewal,
			insuranceCompany,
			expiration,
			franchise,
			...props
		}) => ({
			...props,
			...(props.vehicleWithLicensePlate && {
				plate,
			}),
			...(renewal.value === 'renewal' && {
				renewal: true,
				insuranceCompany,
				expiration,
				franchise,
			}),
		}),
	)
	.superRefine((values, ctx) => {
		if (values.vehicleWithLicensePlate) {
			if (!values.plate) {
				ctx.addIssue({
					code: 'custom',
					path: ['plate'],
					message: 'Placa inválida',
				});
			}
		}

		if (values.renewal) {
			if (!values.insuranceCompany) {
				ctx.addIssue({
					code: 'custom',
					path: ['insuranceCompany'],
					message: 'Seguradora inválida',
				});
			}

			if (!values.expiration) {
				ctx.addIssue({
					code: 'custom',
					path: ['expiration'],
					message: 'Vigência inválida',
				});
			}
		}

		return z.NEVER;
	});

export { SchemaQuoteSimpleSubmit };
