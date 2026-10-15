import type { StaffRole } from '../../utils/user-roles';

const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
	owner: 'Dono',
	admin: 'Administrador',
	manager: 'Gerente',
	broker: 'Corretor',
	finance: 'Financeiro',
	counter: 'Contador',
};

const STAFF_ROLE_DESCRIPTION: Record<StaffRole, string> = {
	owner: 'Responsável pela corretora. Acesso total.',
	admin: 'Administra a corretora e a equipe, exceto o dono.',
	manager: 'Gerencia a operação e cadastra corretores, financeiro e contador.',
	broker: 'Opera cotações e propostas.',
	finance: 'Acompanha pagamentos, comissões e o fluxo financeiro.',
	counter: 'Acompanha os números para a contabilidade.',
};

function translateStaffRole(role: StaffRole) {
	return STAFF_ROLE_LABEL[role];
}

function describeStaffRole(role: StaffRole) {
	return STAFF_ROLE_DESCRIPTION[role];
}

export { describeStaffRole, translateStaffRole };
