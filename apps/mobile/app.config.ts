import type { ConfigContext, ExpoConfig } from 'expo/config';

import { version } from './package.json';

const EAS_PROJECT_ID = !process.env.EXPO_PUBLIC_COMPANY_ID
	? 'd756c43a-d7d8-4021-b5e7-c801b0f55874'
	: '2b548c27-07f9-4378-88c2-2c12483fdc1b';
const PROJECT_SLUG = !process.env.EXPO_PUBLIC_COMPANY_ID
	? 'segwise'
	: 'xcarcorretora';
const OWNER = 'segwise';

const APP_NAME = !process.env.EXPO_PUBLIC_COMPANY_ID
	? 'Segwise'
	: 'XCAR Corretora de Seguros';
const BUNDLE_IDENTIFIER = !process.env.EXPO_PUBLIC_COMPANY_ID
	? 'br.com.segwise'
	: 'br.com.segwise.xcarcorretora';
const PACKAGE_NAME = BUNDLE_IDENTIFIER;
const SCHEME = PROJECT_SLUG;

const VERSION = version;

const config = ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	owner: OWNER,
	name: APP_NAME,
	slug: PROJECT_SLUG,
	scheme: SCHEME,
	version: VERSION,
	platforms: ['android', 'ios'],
	orientation: 'portrait',
	icon: !process.env.EXPO_PUBLIC_COMPANY_ID
		? './src/assets/images/icons/segwise.png'
		: './src/assets/images/icons/xcar.png',
	userInterfaceStyle: 'light',
	ios: {
		supportsTablet: false,
		bundleIdentifier: BUNDLE_IDENTIFIER,
		version: VERSION,
		infoPlist: {
			ITSAppUsesNonExemptEncryption: false,
		},
	},
	android: {
		version: VERSION,
		predictiveBackGestureEnabled: false,
		package: PACKAGE_NAME,
	},
	plugins: [
		[
			'expo-dev-client',
			{
				launchMode: 'launcher',
			},
		],
		'expo-router',
		[
			'expo-splash-screen',
			{
				image: !process.env.EXPO_PUBLIC_COMPANY_ID
					? './src/assets/images/splash-screen/splash-icon.png'
					: './src/assets/images/splash-screen/splash-icon-xcar.png',
				imageWidth: 200,
				sizeMode: 'contain',
				backgroundColor: !process.env.EXPO_PUBLIC_COMPANY_ID
					? '#232323'
					: '#C5302B',
			},
		],
		'expo-font',
		'expo-image',
		'expo-localization',
		'expo-image-picker',
		[
			'@hot-updater/react-native',
			{
				channel: process.env.HOT_UPDATER_CHANNEL,
			},
		],
	],
	experiments: {
		typedRoutes: true,
	},
	extra: {
		apiUrl: process.env.EXPO_PUBLIC_API_URL,
		eas: {
			projectId: EAS_PROJECT_ID,
		},
		...(!!process.env.EXPO_PUBLIC_COMPANY_ID && {
			company: {
				id: process.env.EXPO_PUBLIC_COMPANY_ID,
			},
		}),
		hotUpdater: {
			apiUrl: process.env.HOT_UPDATER_URL,
			token: process.env.HOT_UPDATER_AUTH_TOKEN,
		},
	},
});

export default config;
