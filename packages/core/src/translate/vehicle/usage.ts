import type { VehicleUsage } from '@/types/vehicles';

function translateVehicleUsage(usage: VehicleUsage) {
	switch (usage) {
		case 'leisure_and_work':
			return 'Lazer e Ida e Volta ao Trabalho';

		case 'leisure':
			return 'Lazer';

		case 'client_supplier_visits':
			return 'Visita a Clientes / Fornecedores';

		case 'app_based_transport':
			return 'Transporte de Aplicativo';

		case 'public_transportation':
			return 'Lotação';

		case 'taxi':
			return 'Táxi';

		case 'delivieries':
			return 'Entregas';

		case 'tourism':
			return 'Turismo';

		default:
			return usage;
	}
}

export { translateVehicleUsage };
