const APP_STORE_URL = Bun.env.IOS_APP_URL as string;
const PLAY_STORE_URL = Bun.env.ANDROID_APP_URL as string;

const APP_STORE_XCAR_URL = Bun.env.IOS_XCAR_APP_URL as string;
const PLAY_STORE_XCAR_URL = Bun.env.ANDROID_XCAR_APP_URL as string;

const FALLBACK_URL = 'https://segwise.com.br';

export {
	APP_STORE_URL,
	APP_STORE_XCAR_URL,
	FALLBACK_URL,
	PLAY_STORE_URL,
	PLAY_STORE_XCAR_URL,
};
