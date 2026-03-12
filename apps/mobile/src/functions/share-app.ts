import { Share } from 'react-native';

async function ShareApp() {
	await Share.share({
		url: 'https://segwise.com.br/share/application',
		message: 'llllll',
		title: 'fdsfdsfdsf',
	});
}

export { ShareApp };
