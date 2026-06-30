import { openURL } from 'expo-linking';

async function ShareApp() {
	const url = new URL('https://xcarcorretora.com.br/application');

	url.searchParams.set('package', 'br.com.segwise.xcarcorretora');

	const message = `Estou compartilhando esse aplicativo de seguros, que nos ajuda na hora do sinistro.\n\n*Mesmo que o seu corretor não lhe atenda* este aplicativo vai orientar:\n\n*- EM CASO DE ACIDENTE*\nO que fazer?\nPara onde ligar?\nComo agir?\nE se houver vítima?\nQual sua seguradora?\n\n*- INFORMAÇÕES RELEVANTES PARA NÃO TER SEU SINISTRO NEGADO*\n\nSinta-se seguro, a qualquer hora ou lugar\n\nE ainda:\nOrçamento de seguros, sem compromisso e com o melhor preço\n\nBaixe agora o aplicativo:\n*XCAR CORRETORA*\n\nOu clique no link abaixo:\n${url.toString()}\n\nSurpreenda-se com todas as ajudas que você encontrará no melhor aplicativo do Brasil`;

	const whatsappUrl = `whatsapp://send?text=${message}`;
	const whatsappFallbackUrl = `https://wa.me/?text=${message}`;

	try {
		await openURL(whatsappUrl);
	} catch {
		await openURL(whatsappFallbackUrl);
	}
}

export { ShareApp };
