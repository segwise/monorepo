import type { ConfigContext, ExpoConfig } from 'expo/config';

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

const VERSION_CODE = 22;
const VERSION = `1.0.${VERSION_CODE}`;

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
		buildNumber: VERSION_CODE.toString(),
		infoPlist: {
			ITSAppUsesNonExemptEncryption: false,
		},
	},
	android: {
		version: VERSION,
		predictiveBackGestureEnabled: false,
		package: PACKAGE_NAME,
		versionCode: VERSION_CODE,
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
				image: './src/assets/images/splash-screen/splash-icon.png',
				imageWidth: 200,
				sizeMode: 'contain',
				backgroundColor: '#232323',
			},
		],
		'expo-font',
		'expo-image',
		[
			'expo-tracking-transparency',
			{
				userTrackingPermission:
					'This identifier will be used to deliver personalized ads to you.',
			},
		],
		'expo-localization',
		'expo-image-picker',
	],
	experiments: {
		typedRoutes: true,
	},
	extra: {
		eas: {
			projectId: EAS_PROJECT_ID,
		},
		...(!!process.env.EXPO_PUBLIC_COMPANY_ID && {
			company: {
				id: process.env.EXPO_PUBLIC_COMPANY_ID,
			},
		}),
	},
});

export default config;
