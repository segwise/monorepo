import type z from 'zod';
import type {
	SchemaUserRegister,
	SchemaUserStatus,
	SchemaUserUpdate,
} from '../../schemas/users';
import type { StaffRole } from '../../utils/user-roles';

type UserRegister = z.infer<typeof SchemaUserRegister>;
type UserUpdate = z.infer<typeof SchemaUserUpdate>;
type UserStatusInput = z.infer<typeof SchemaUserStatus>;

// `active` e `suspended` são membros; `pending` é convite ainda não aceito
// (o id, nesse caso, é o do convite).
type UserListItem = {
	id: string;
	origin: 'active' | 'pending';
	name: string | null;
	email: string;
	cpf: string | null;
	phone: string | null;
	role: StaffRole;
	// `deleted` = excluído (lógico): sem acesso, dados mantidos, restaurável
	// cadastrando o mesmo e-mail de novo.
	status: 'active' | 'suspended' | 'deleted' | 'pending';
	createdAt: string;
	expiresAt: string | null;
	canManage: boolean;
};

type UserList = {
	viewerRole: StaffRole;
	assignableRoles: Array<StaffRole>;
	items: Array<UserListItem>;
};

export type {
	UserList,
	UserListItem,
	UserRegister,
	UserStatusInput,
	UserUpdate,
};
