import Constants from 'expo-constants';

const isCompany = !!Constants.expoConfig?.extra?.company?.id;
const companyId = Constants.expoConfig?.extra?.company?.id;

export { companyId, isCompany };
