import { endOfDay } from 'date-fns';
import z from 'zod';
import { isDateString } from '../../../valids/date';
import { SchemaReferral } from '../../producers';
import {
	SchemaCPFOrCNPJ,
	SchemaMaritalStatus,
	SchemaName,
	SchemaPhone,
	SchemaPlate,
	SchemaPostalCode,
	SchemaVehicleUsage,
} from '../../utils';
import { SchemaModality } from '../../utils/modality';
import { SchemaQuoteType } from '../type';

const SchemaQuoteTypeEdit = z.enum([
	...Object.values(SchemaQuoteType.enum),
	'association',
]);

const SchemaQuoteSimpleRegister = z
	.object({
		type: z
			.object({
				label: z.string(),
				value: SchemaQuoteTypeEdit,
			})
			.or(SchemaQuoteTypeEdit),
		modality: SchemaModality,
		vehicleWithLicensePlate: z.boolean(),
		plate: SchemaPlate.nullish(),
		usage: z
			.object({
				label: z.string(),
				value: SchemaVehicleUsage,
			})
			.or(SchemaVehicleUsage),
		postalCode: SchemaPostalCode,
		insured: z.object({
			name: SchemaName,
			registration: SchemaCPFOrCNPJ.nullish(),
			phone: SchemaPhone,
			maritalStatus: z
				.object({
					label: z.string(),
					value: SchemaMaritalStatus,
				})
				.or(SchemaMaritalStatus),
		}),
		insuranceCompany: z
			.object(
				{
					label: z.string(),
					value: z.uuidv7('Seguradora inválida'),
				},
				'Seguradora inválida',
			)
			.or(z.uuidv7('Seguradora inválida'))
			.nullish(),
		expiration: z
			.string()
			.refine(isDateString, 'Vigência inválida')
			.transform((value) => {
				const splits = value.split('/').flatMap((value) => Number(value));
				if (!splits[0] || !splits[1] || !splits[2]) {
					throw new Error('Falha ao transformar data');
				}
				const day = splits[0];
				const month = splits[1] - 1;
				const year = splits[2];
				return new Date(year, month, day);
			})
			.or(z.date('Vigência inválida'))
			.or(z.iso.datetime('Vigência inválida'))
			.transform((value) => endOfDay(value))
			.nullish(),
		franchise: z.coerce.number('Frânquia inválido').nullish(),
		referral: SchemaReferral.nullish(),
	})
	.transform((props) => ({
		...props,
		usage: typeof props.usage === 'string' ? props.usage : props.usage.value,
	}))
	.transform(
		({
			type,
			plate,
			insuranceCompany,
			expiration,
			franchise,
			insured,
			...props
		}) => ({
			...props,
			type,
			...(props.vehicleWithLicensePlate && {
				plate,
			}),
			insured: {
				...insured,
				maritalStatus:
					typeof insured.maritalStatus !== 'string'
						? insured.maritalStatus?.value
						: insured.maritalStatus,
			},
			association:
				typeof type === 'string'
					? type === 'association'
					: typeof type === 'object' && type.value === 'association',
			renewal:
				typeof type === 'string'
					? type === 'renewal'
					: typeof type === 'object' && type.value === 'renewal',
			...(((typeof type === 'string' && type === 'renewal') ||
				(typeof type === 'object' && type.value === 'renewal')) && {
				insuranceCompany:
					typeof insuranceCompany !== 'string'
						? insuranceCompany?.value
						: insuranceCompany,
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

const SchemaQuoteSimpleCustomRegister = z.object({
	referral: SchemaReferral.nullish(),
	type: z.enum([
		'health',
		'residence',
		'business',
		'condominium',
		'travel',
		'professional',
		'construction',
	]),
	insured: z.object({
		name: SchemaName,
		phone: SchemaPhone,
	}),
});

export { SchemaQuoteSimpleCustomRegister, SchemaQuoteSimpleRegister };
