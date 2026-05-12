import { signIn } from './auth';
import { cities } from './cities';
import { states } from './states';
import {
	myVehicles,
	vehicleDelete,
	vehicleDetails,
	vehicleEdit,
	vehicleRegister,
	vehicles,
} from './vehicles';

const marketplace = {
	signIn,
	listining: vehicles,
	cities,
	states,
	myVehicles,
	vehicleDelete,
	details: vehicleDetails,
	register: vehicleRegister,
	edit: vehicleEdit,
};

export { marketplace };
