import { environment } from '@/libraries/environment';

const companyId = environment.EXPO_PUBLIC_COMPANY_ID;

const isCompany = !!companyId;

export { companyId, isCompany };
