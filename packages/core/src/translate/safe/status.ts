import type { SafeStatus } from '../../types/safes';

function translateSafeStatus(status: SafeStatus) {
	switch (status) {
		case 'canceled':
			return 'Cancelado';
		case 'suspended':
			return 'Suspenso';
		case 'active':
			return 'Ativo';
		default:
			return status;
	}
}

export { translateSafeStatus };
