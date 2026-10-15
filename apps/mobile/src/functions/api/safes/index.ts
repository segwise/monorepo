import { isSafePlate } from './is-plate';
import { safesListining, safesListiningRegistration } from './listining';

const safes = {
	listining: safesListining,
	registration: safesListiningRegistration,
	isPlate: isSafePlate,
};

export { safes };
