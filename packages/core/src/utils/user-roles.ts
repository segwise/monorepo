// Papéis da EQUIPE da corretora (Member.role). Produtor/parceiro fica fora: tem
// menu e cadastro próprios. A hierarquia vale para o backend (que aplica) e para a
// tela (que só oferece o que o backend aceitaria).
const STAFF_ROLES = [
	'owner',
	'admin',
	'manager',
	'broker',
	'finance',
	'counter',
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

// Maior = mais poder. Corretor, financeiro e contador são o mesmo nível.
const STAFF_ROLE_RANK: Record<StaffRole, number> = {
	owner: 4,
	admin: 3,
	manager: 2,
	broker: 1,
	finance: 1,
	counter: 1,
};

// Quem pode ver a lista de usuários e cadastrar/alterar alguém.
const MIN_RANK_TO_MANAGE_USERS = STAFF_ROLE_RANK.manager;

function isStaffRole(role: unknown): role is StaffRole {
	return STAFF_ROLES.includes(role as StaffRole);
}

function canAccessUsers(role: unknown): boolean {
	return isStaffRole(role) && STAFF_ROLE_RANK[role] >= MIN_RANK_TO_MANAGE_USERS;
}

// Papéis que `actor` pode atribuir ao cadastrar ou alterar: só os de nível
// ESTRITAMENTE abaixo do seu (nunca igual, nunca superior) e nunca dono.
function assignableStaffRoles(actor: unknown): Array<StaffRole> {
	if (!canAccessUsers(actor)) {
		return [];
	}

	const rank = STAFF_ROLE_RANK[actor as StaffRole];

	return STAFF_ROLES.filter(
		(role) => role !== 'owner' && STAFF_ROLE_RANK[role] < rank,
	);
}

// `actor` pode alterar/suspender quem hoje tem o papel `target` (e só para um
// papel que ele também poderia atribuir).
function canManageStaffRole(actor: unknown, target: unknown): boolean {
	return (
		isStaffRole(target) &&
		canAccessUsers(actor) &&
		STAFF_ROLE_RANK[target] < STAFF_ROLE_RANK[actor as StaffRole]
	);
}

export {
	STAFF_ROLES,
	STAFF_ROLE_RANK,
	assignableStaffRoles,
	canAccessUsers,
	canManageStaffRole,
	isStaffRole,
	type StaffRole,
};
