import type { VehicleExchange } from '@/types/vehicles/exchange';

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
