import type { MaritalStatus } from '../../types/utils';

function translateMaritalStatus(maritalStatus: MaritalStatus) {
	switch (maritalStatus) {
		case 'single':
			return 'Solteiro(a)';
		case 'common_law_marriage':
			return 'União Estável';
		case 'separated':
			return 'Separado(a)';
		case 'divorced':
			return 'Divorciado(a)';
		case 'married':
			return 'Casado(a)';
		case 'widowed':
			return 'Viúvo(a)';
		default:
			return maritalStatus;
	}
}

export { translateMaritalStatus };
