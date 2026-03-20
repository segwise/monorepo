import { Share } from 'react-native';

async function ShareApp() {
	await Share.share({
		message:
			'*FUJA DA DOR DE CABEÇA*, estou compartilhando esse aplicativo de seguros, que nos ajuda muito na hora de um sinistro.\n*Mesmo que o seu corretor não lhe atenda* este aplicativo te orienta:\n\n*EM CASO DE ACIDENTE*\nO que fazer? Para onde ligar?\nComo agir? E se houver vítima?\nQual sua seguradora?\nQue seguros você tem?\n\nBaixe agora o aplicativo:\n*SEGWISE*\n\nOu clique no link abaixo:\nhttps://segwise.com.br/application\n\nSinta-se seguro, a qualquer hora ou lugar\n\nE ainda:\nReceba seu orçamento de seguro, sem compromisso e com o melhor preço\n\nSurpreenda-se com todas as ajudas que você encontrará no melhor aplicativo do Brasil',
	});
}

export { ShareApp };
