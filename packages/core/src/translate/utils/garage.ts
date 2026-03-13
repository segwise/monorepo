import type { Garage, GarageSchool, GarageWork } from '@/types/utils/garage';

function translateGarage(garage: Garage) {
	switch (garage) {
		case 'manual_gate':
			return 'Portão Manual';
		case 'automatic_gate':
			return 'Portão Automático';
		case 'private':
			return 'Garagem Privada';
		case 'no_garage':
			return 'Sem Garagem';
		default:
			return garage;
	}
}

function translateGarageWork(garage: GarageWork) {
	switch (garage) {
		case 'does_not_work':
			return 'Não Trabalha';
		case 'yes':
			return 'Sim';
		case 'no':
			return 'Não';
		case 'does_not_use':
			return 'Não Utiliza Para Trabalho';

		default:
			return garage;
	}
}

function translateGarageSchool(garage: GarageSchool) {
	switch (garage) {
		case 'does_not_study':
			return 'Não Estuda';
		case 'yes':
			return 'Sim';
		case 'no':
			return 'Não';
		case 'does_not_use':
			return 'Não Utiliza Para Estudar';

		default:
			return garage;
	}
}

export { translateGarage, translateGarageWork, translateGarageSchool };
