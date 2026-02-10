import type { Garage } from '@/types/utils/garage';

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

export { translateGarage };
