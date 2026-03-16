import { Share } from 'react-native';

async function ShareApp() {
	await Share.share({
		url: 'https://segwise.com.br/application',
		title: 'SEGWISE - TORNA SUA VIDA MAIS FÁCIL',
		message:
			'*ESTA É PRA VOCÊ RESPONDER*\n\n*EM CASO DE ACIDENTE*\nO que fazer? Para onde ligar?\nComo agir? E se houver vítima?\nQual sua seguradora?\nQue seguros você tem?\n\nTenha todas estas respostas e muito mais.\n\nBaixe agora em sua loja o aplicativo, *SEGWISE*\n\nOu clique no link abaixo:\nhttps://segwise.com.br/application\n\nSurpreenda-se com todas as ajudas que você encontrará no melhor aplicativo do Brasil',
	});
}

export { ShareApp };
