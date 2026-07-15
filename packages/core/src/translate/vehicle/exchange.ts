import type { VehicleExchange } from '../../types/vehicles';

function translateVehicleExchange(usage: VehicleExchange) {
	switch (usage) {
		case 'manual':
			return 'Manual';
		case 'automatic':
			return 'Automático';
		default:
			return usage;
	}
}

export { translateVehicleExchange };
