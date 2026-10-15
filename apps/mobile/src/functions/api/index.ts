import { financing } from './financing';
import { insuranceCompanies } from './insurance-companies';
import { marketplace } from './marketplace';
import { quotes } from './quotes';
import { referral } from './referral';
import { safes } from './safes';

const fetchApi = {
	quotes,
	referral,
	insuranceCompanies,
	safes,
	financing,
	marketplace,
};

export { fetchApi };
