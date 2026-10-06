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
	phone: string | null;
	role: StaffRole;
	status: 'active' | 'suspended' | 'pending';
	createdAt: string;
	expiresAt: string | null;
	isSelf: boolean;
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
