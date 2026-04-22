import { api } from '@/libraries/api';
import { storage } from '@/libraries/storage';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';

async function attributeReferral() {
	try {
		const locale = getLocales();

		const payload = {
			language: locale[0].languageTag,
			os: Platform.OS,
		};

		const { data } = await api.post<{
			referralCode: string;
		}>('/referral', payload);

		const code = data.referralCode;

		if (code) {
			storage.set('referral', code);
		}
	} catch {}
}

export { attributeReferral };
