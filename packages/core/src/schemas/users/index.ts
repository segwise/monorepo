import z from 'zod';
import { STAFF_ROLES } from '../../utils/user-roles';
import { SchemaEmail, SchemaName, SchemaPhone } from '../utils';

// Dono não se cadastra por aqui: a corretora tem um só e ele não se transfere.
const SchemaStaffRole = z.enum(
	STAFF_ROLES.filter((role) => role !== 'owner') as [
		'admin',
		'manager',
		'broker',
		'finance',
		'counter',
	],
	'Perfil inválido',
);

const SchemaUserRegister = z.object({
	name: SchemaName,
	email: SchemaEmail,
	phone: SchemaPhone.nullish().or(z.literal('')),
	role: SchemaStaffRole,
});

const SchemaUserUpdate = z.object({
	name: SchemaName,
	phone: SchemaPhone.nullish().or(z.literal('')),
	role: SchemaStaffRole,
});

const SchemaUserStatus = z.object({
	status: z.enum(['active', 'suspended'], 'Status inválido'),
});

export {
	SchemaStaffRole,
	SchemaUserRegister,
	SchemaUserStatus,
	SchemaUserUpdate,
};
