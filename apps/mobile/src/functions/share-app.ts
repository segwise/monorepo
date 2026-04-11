import { Share } from 'react-native';

async function ShareApp() {
	await Share.share({
		message:
			'Estou compartilhando esse aplicativo de seguros, que nos ajuda na hora do sinistro.\n\n*Mesmo que o seu corretor não lhe atenda* este aplicativo vai orientar:\n\n*- EM CASO DE ACIDENTE*\nO que fazer? Para onde ligar?\nComo agir? E se houver vítima?\nQual sua seguradora?\n\n*- INFORMAÇÕES RELEVANTES PARA NÃO TER SEU SINISTRO NEGADO*\n\nSinta-se seguro, a qualquer hora ou lugar\n\nE ainda:\nOrçamento de seguros, sem compromisso e com o melhor preço\n\nBaixe agora o aplicativo:\n*SEGWISE*\n\nOu clique no link abaixo:\nhttps://segwise.com.br/application\n\nSurpreenda-se com todas as ajudas que você encontrará no melhor aplicativo do Brasil',
	});
}

export { ShareApp };
