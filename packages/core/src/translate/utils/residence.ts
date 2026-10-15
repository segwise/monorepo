import type { Residence } from '../../types/utils';

function translateResidence(garage: Residence) {
	switch (garage) {
		case 'home':
			return 'Casa';
		case 'apartment':
			return 'Apartamento';
		case 'house_condominium':
			return 'Condomínio de Casas';
		case 'others':
			return 'Outros';
		default:
			return garage;
	}
}

export { translateResidence };
