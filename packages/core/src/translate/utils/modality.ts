import type { Modality } from '../../types/utils';

function translateModality(modality: Modality) {
	switch (modality) {
		case 'vehicle':
			return 'Seguro Automóvel';
		case 'motorcycle':
			return 'Seguro Motocicleta';
		case 'truck':
			return 'Seguro Caminhão';
		case 'health':
			return 'Plano de Saúde';
		case 'residence':
			return 'Seguro Residencial';
		case 'business':
			return 'Seguro Empresarial';
		case 'condominium':
			return 'Seguro Condomínio';
		case 'travel':
			return 'Seguro Viagem';
		case 'professional':
			return 'RC Profissional';
		case 'construction':
			return 'RC Obras e Reformas';
		default:
			return modality;
	}
}

export { translateModality };
