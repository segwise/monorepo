import type { ConfigContext, ExpoConfig } from 'expo/config';

const EAS_PROJECT_ID = !process.env.COMPANY_ID
	? 'd756c43a-d7d8-4021-b5e7-c801b0f55874'
	: '2b548c27-07f9-4378-88c2-2c12483fdc1b';
const PROJECT_SLUG = !process.env.COMPANY_ID ? 'segwise' : 'xcarcorretora';
const OWNER = 'segwise';

const APP_NAME = !process.env.COMPANY_ID
	? 'Segwise'
	: 'XCAR Corretora de Seguros';
const BUNDLE_IDENTIFIER = !process.env.COMPANY_ID
	? 'br.com.segwise'
	: 'br.com.segwise.xcarcorretora';
const PACKAGE_NAME = BUNDLE_IDENTIFIER;
const SCHEME = PROJECT_SLUG;

const VERSION_CODE = 20;
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
	icon: !process.env.COMPANY_ID
		? './src/assets/images/icons/ios-light.png'
		: './src/assets/images/icons/xcar.png',
	userInterfaceStyle: 'light',
	ios: {
		supportsTablet: true,
		bundleIdentifier: BUNDLE_IDENTIFIER,
		icon: {
			light: './src/assets/images/icons/ios-light.png',
			dark: './src/assets/images/icons/ios-dark.png',
			tinted: './src/assets/images/icons/ios-tinted.png',
		},
		version: VERSION,
		buildNumber: VERSION_CODE.toString(),
	},
	android: {
		version: VERSION,
		adaptiveIcon: {
			foregroundImage: './src/assets/images/icons/adaptive-icon.png',
			monochromeImage: './src/assets/images/icons/adaptive-icon.png',
			backgroundColor: '#232323',
		},
		predictiveBackGestureEnabled: false,
		package: PACKAGE_NAME,
		versionCode: VERSION_CODE,
	},
	splash: {
		image: './src/assets/images/splash-screen/splash-icon-light.png',
		resizeMode: 'contain',
		backgroundColor: '#232323',
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
				image: './src/assets/images/splash-screen/splash-icon-light.png',
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
		...(!!process.env.COMPANY_ID && {
			company: {
				id: process.env.COMPANY_ID,
			},
		}),
	},
});

export default config;
