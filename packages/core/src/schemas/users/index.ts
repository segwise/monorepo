import z from 'zod';
import { STAFF_ROLES } from '../../utils/user-roles';
import { SchemaCPF, SchemaEmail, SchemaName, SchemaPhone } from '../utils';

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

// CPF e celular são obrigatórios tanto ao cadastrar quanto ao editar.
const SchemaUserRegister = z.object({
	name: SchemaName,
	email: SchemaEmail,
	cpf: SchemaCPF,
	phone: SchemaPhone,
	role: SchemaStaffRole,
});

const SchemaUserUpdate = z.object({
	name: SchemaName,
	cpf: SchemaCPF,
	phone: SchemaPhone,
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
