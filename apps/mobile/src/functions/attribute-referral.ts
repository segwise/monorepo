import { api } from '@/libraries/api';
import { storage } from '@/libraries/storage';
import { osName } from 'expo-device';
import { getLocales } from 'expo-localization';

async function attributeReferral() {
	try {
		const locale = getLocales();

		const payload = {
			language: locale[0].languageTag,
			os: osName,
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
