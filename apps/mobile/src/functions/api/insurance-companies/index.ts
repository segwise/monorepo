import { getInsuranceCompaniesById } from './details';
import { getInsuranceCompaniesSimple } from './simple';

const insuranceCompanies = {
	simple: getInsuranceCompaniesSimple,
	details: getInsuranceCompaniesById,
};

export { insuranceCompanies };
