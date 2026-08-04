import type { Environment } from '@/@types/environment';
import Constants from 'expo-constants';
import { SchemaEnvironment } from './schemas/environment';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

const EXPO_PUBLIC_COMPANY_ID = Constants.expoConfig?.extra?.company.id;

const HOT_UPDATER_URL = Constants.expoConfig?.extra?.hotUpdater.apiUrl;
const HOT_UPDATER_AUTH_TOKEN = Constants.expoConfig?.extra?.hotUpdater.apiUrl;

const environment = SchemaEnvironment.parse({
	API_URL,
	HOT_UPDATER_URL,
	EXPO_PUBLIC_COMPANY_ID,
	HOT_UPDATER_AUTH_TOKEN,
} satisfies Environment);

export { environment };
