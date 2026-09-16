import type { Server } from '@/@types/server';
import { TemplatePartnershipInviteAccounting } from '../../templates/partnership-invite/accounting';
import { TemplatePartnershipInviteCondominium } from '../../templates/partnership-invite/condominium';

type Contact = {
	nome: string;
	email: string;
};

const contactsAccounting: Contact[] = [
	// {
	// 	nome: 'AC Consult Gestao em Contabilidade Ltda',
	// 	email: 'erikacomunicacao@hotmail.com',
	// },
	// {
	// 	nome: 'ARV Auditores e Consultores Independentes Ltda',
	// 	email: 'secretaria@arvauditores.com.br',
	// },
	// { nome: 'Agir Assessoria Empresarial Ltda.', email: 'ronaldo@agir.com.br' },
	// {
	// 	nome: 'Escritecont Assessoria Contabil Ltda',
	// 	email: 'escritecont@terra.com.br',
	// },
	// {
	// 	nome: 'GS & Carvalho Assessoria Contabil Ltda',
	// 	email: 'carlomanojunior@terra.com.br',
	// },
	// { nome: 'J Barros Contabilidade S/C Ltda', email: 'jrd.barros@gmail.com' },
	// { nome: 'JBC Assessoria Contábil Ltda.', email: 'jbc@hotlink.com.br' },
	// {
	// 	nome: 'Consultserv - Consultoria e Servicos de Contabilidade do Nordeste Ltda',
	// 	email: 'diretoria@cscne.com.br',
	// },
	// { nome: 'JFA Contabilidade Ltda - ME', email: 'pessoal.jfa@gmail.com' },
	// {
	// 	nome: 'Meta Contadores Associados Ltda',
	// 	email: 'reinaldomendes@hotmail.com',
	// },
	// {
	// 	nome: '100 Porcento Audit - Auditores Independentes S/S',
	// 	email: 'fcaldas@100porcento.srv.br',
	// },
	// {
	// 	nome: 'A Contabil Servicos de Contabilidade Ltda',
	// 	email: 'alvoradaltda@uol.com.br',
	// },
	// {
	// 	nome: 'A R de Macedo Servicos Contabeis Eireli',
	// 	email: 'sac@agmconsultoria.com',
	// },
	// {
	// 	nome: 'Absoluta Contabilidade',
	// 	email: 'absoluta@absolutacontabilidade.com.br',
	// },
	// {
	// 	nome: 'Acene Assessoria Contabil e Consul. Emp. do NE',
	// 	email: 'carmelo@acenecontabilidade.com.br',
	// },
	// {
	// 	nome: 'Acerto Contadores Associados Ltda',
	// 	email: 'claudetecontabil@yahoo.com.br',
	// },
	// {
	// 	nome: 'Age Consulting Serv de Apoio Adm e Cont Ltda',
	// 	email: 'sergio@ageconsulting.com.br',
	// },
	// { nome: 'Agenda Empresarial Ltda - EPP', email: 'alba@agenda.com.br' },
	// {
	// 	nome: 'AGF Contabil e Treinamento Empresarial Ltda-EPP',
	// 	email: 'agf.pe2@agfconsultores.com.br',
	// },
	// {
	// 	nome: 'AGS Assessoria e Gerência de Sistemas Ltda',
	// 	email: 'agstca@uol.com.br',
	// },
	// { nome: 'Albani José Ribeiro de Lima', email: 'albanilima@zipmail.com.br' },
	// { nome: 'Alberto Pinto Vilaça de Lima', email: 'albertovilaca@bol.com.br' },
	// { nome: 'Alec Contábil Ltda.', email: 'adelvanialec@alec.com.br' },
	// { nome: 'Art Conta', email: 'eduardoanjos2012@hotmail.com' },
	// {
	// 	nome: 'Asisconta - Ass. Contabil e Fiscal S/C Ltda.',
	// 	email: 'gqueiros@assconta.com.br',
	// },
	// continuar daqui
	// {
	// 	nome: 'Ativa Contabil e Processamento de Dados Ltda - ME',
	// 	email: 'cida@emcconsultoria.combr',
	// },
	// {
	// 	nome: 'Audiccon - Auditoria & Consultoria Contabil Ltda - ME',
	// 	email: 'adrianamoura@audiccon.com.br',
	// },
	// {
	// 	nome: 'Bacelar Cavalcanti Assessoria Contabil',
	// 	email: 'daniel@bacelaralbuquerque.com.br',
	// },
	// { nome: 'Base Servicos Contabeis Ltda', email: 'ratis@baseconsultoria.net' },
	// { nome: 'Bernhoeft Auditores Ltda', email: 'jleite@bernhoeft.com.br' },
	// {
	// 	nome: 'BGN Consultores em Contabilidade Ltda',
	// 	email: 'flavio@bgncontabilidade.com.br',
	// },
	// {
	// 	nome: 'BKR - Lopes, Machado Auditores e Consultores Ltda - EPP',
	// 	email: 'mguerra@bkr-lopesmachado.com.br',
	// },
	// {
	// 	nome: 'BM4 Consultoria Contabil',
	// 	email: 'bm4consultoriacontabil@gmail.com',
	// },
	// {
	// 	nome: 'Campos & Garcia Cons. e Contad. Associados',
	// 	email: 'camposegarcia@camposegarcia.com.br',
	// },
	// {
	// 	nome: 'Carvalho Assessoria Contabil',
	// 	email: 'carvalhoassessoria@hotmail.com',
	// },
	// {
	// 	nome: 'Centro de Estudos Contabeis Ltda',
	// 	email: 'profcesario@hotmail.com',
	// },
	// { nome: 'Conasc Contadores Associados Ltda', email: 'contato@conasc.com.br' },
	// { nome: 'Conascont - Contabilidade Ltda', email: 'alberto@conascont.com.br' },
	// {
	// 	nome: 'Conase - Contabilidade e Assessoria de Empresas Ltda',
	// 	email: 'conasepimentel@hotmail.com',
	// },
	// {
	// 	nome: 'Confisco Contabilidade Ltda ME',
	// 	email: 'franciscopazjr@hotmail.com',
	// },
	// {
	// 	nome: 'Consercon Processamento de Dados Limitada - ME',
	// 	email: 'consercon@consercon.com.br',
	// },
	// {
	// 	nome: 'Consplan Assessoria e Planejamento Ltda',
	// 	email: 'jaugusmarinho@hotmail.com',
	// },
	// {
	// 	nome: 'Conta Mais - Servicos de Contabilidade Ltda',
	// 	email: 'contamais@globo.com',
	// },
	// { nome: 'Contadores Independentes Ltda', email: 'silcel5@hotmail.com' },
	// {
	// 	nome: 'Contar Contadores Associados Ltda',
	// 	email: 'joao.borba@contarweb.com.br',
	// },
	// {
	// 	nome: 'Continf - Contabilidade Informatizada Ltda',
	// 	email: 'continf@uol.com.br',
	// },
	// {
	// 	nome: 'Contline Assessoria Contábil Ltda',
	// 	email: 'erikaraujo@contline.srv.br',
	// },
	// {
	// 	nome: 'Controllers Assessoria e Consultoria Contabil Ltda',
	// 	email: 'elaine@controllersbr.com',
	// },
	// {
	// 	nome: 'Contserv Contabilidade e Serviços Ltda - ME',
	// 	email: 'contserv@elogica.com.br',
	// },
	// {
	// 	nome: 'Coutinho Contadores Ltda',
	// 	email: 'fabio@coutinhocontadores.com.br',
	// },
	// {
	// 	nome: 'Directivos S/C Contadores Assoc Ltda.',
	// 	email: 'directivos@directivos.com.br',
	// },
	// {
	// 	nome: 'Dom Contabil - Contabilidade Auditoria e Assessoria Ltda',
	// 	email: 'domcont@hotmail.com',
	// },
	// {
	// 	nome: 'Edileila Silva Barbosa ME',
	// 	email: 'edileila.contabilidade@hotmail.com',
	// },
	// {
	// 	nome: 'Edson & Roger Melo Assessoria Contábil S/S',
	// 	email: 'edson.roger@terra.com.br',
	// },
	// {
	// 	nome: 'Efata Contabilidade e Consultoria Ltda - ME',
	// 	email: 'erika.contabilidade@efatacontabilidade.com.br',
	// },
	// { nome: 'Elohim Assessoria Contabil', email: 'socorro@elohim.cnt.br' },
	// {
	// 	nome: 'Emecinco Contabilidade e Serviços',
	// 	email: 'emecinco@emecinco.com.br',
	// },
	// { nome: 'ERS Contabilidade', email: 'emanuel@erscontabil.com.br' },
	// {
	// 	nome: 'Expertise Auditoria e Consultoria Ltda.',
	// 	email: 'expertise@expertiseauditoria.com',
	// },
	// {
	// 	nome: 'Faros Assessoria Contabil e Empresarial Ltda - ME',
	// 	email: 'fabio.roberto@faros.com.br',
	// },
	// {
	// 	nome: 'Finanza Consultoria & Contabilidade',
	// 	email: 'finanza@finanza.cnt.br',
	// },
	// {
	// 	nome: 'G G B Assessoria Contabil, Fiscal e Trabalhista Ltda',
	// 	email: 'fiscal@brumarcontabil.com.br',
	// },
	// { nome: 'G7 Contabilidade Ltda', email: 'g7contabilidade@uol.com.br' },
	// {
	// 	nome: 'Gerencial Consultores Associados Ltda',
	// 	email: 'italo@gerencialconsultores.com',
	// },
	// {
	// 	nome: 'HVR Soluções em Contabilidade Ltda ME',
	// 	email: 'contato@hvrcontabil.com.br',
	// },
	// {
	// 	nome: 'Ivo Barboza & Advogados Associados',
	// 	email: 'ivolima@ivobarbozaadv.com.br',
	// },
	// {
	// 	nome: 'J. Silva Assessoria Ltda',
	// 	email: 'alexandre@jsilvacontabil.com.br',
	// },
	// { nome: 'JC Buarque Contabilidade', email: 'diretoria@jcbuarque.com.br' },
	// {
	// 	nome: 'JFS Servicos de Contabilidade Ltda',
	// 	email: 'josefelix@jfsauditores.com.br',
	// },
	// {
	// 	nome: 'JMSA Gestao & Servicos Contabeis Ltda - EPP',
	// 	email: 'michelle@jmsa-pe.com.br',
	// },
	// {
	// 	nome: 'Jose Miguel Arcanjo Filho',
	// 	email: 'miguelarcanjo@contabilservice.cnt.br',
	// },
	// { nome: 'Leverrier Assessoria Contabil Ltda', email: 'leverrier@uol.com.br' },
	// { nome: 'Lex Cora S/C Ltda.', email: 'christian@lexcora.com.br' },
	// {
	// 	nome: 'LGLuz Assessoria Empresarial Ltda',
	// 	email: 'lgluzassessoria@uol.com.br',
	// },
	// {
	// 	nome: 'Lira & Santos Contadores Associados S/S',
	// 	email: 'silvioliracontas@hotmail.com',
	// },
	// {
	// 	nome: 'Maria Silva Contabilidade',
	// 	email: 'mariasilvacontabilidade@gmail.com',
	// },
	// {
	// 	nome: 'M & W Assessoria Empresarial Ltda',
	// 	email: 'mw@mwassessoria.com.br',
	// },
	// { nome: 'Melo & Brasil Ltda.', email: 'melobrasil@uol.com.br' },
	// {
	// 	nome: 'MESPR - Assessoria Empresarial e Contabil Ltda',
	// 	email: 'mespr@mespr.com.br',
	// },
	// {
	// 	nome: 'Mota e Carvalho Contabilidade Ltda',
	// 	email: 'katiuscia@meccontabilidade.com.br',
	// },
	// {
	// 	nome: 'Multicont Contabilidade e Consultoria S/C',
	// 	email: 'silvamulticont@aol.com',
	// },
	// {
	// 	nome: 'Multicontábil do Nordeste Ltda.',
	// 	email: 'multicontabil@multicontabil.cnt.br',
	// },
	// {
	// 	nome: 'Nascimento Assessoria Contabil e Servicos Ltda',
	// 	email: 'joana@nascont.com.br',
	// },
	// {
	// 	nome: 'Nassau Auditores e Consultores Associados S/C Ltda.',
	// 	email: 'nassau.audit@terra.com.br',
	// },
	// { nome: 'Tecjur Ltda', email: 'almir@tecjur.com.br' },
];

const contactsCondominium: Contact[] = [
	// {
	// 	nome: 'A & M Administradora de Condomínios',
	// 	email: 'aemcondominio@gmail.com',
	// },
	// { nome: 'Ability Serviços', email: 'ability@abilityservicos.com.br' },
	// { nome: 'Acin-Aguiar Condomínios', email: 'acincondominios@uol.com.br' },
	// { nome: 'Acta Administração Especializada', email: 'contato@actaadm.com.br' },
	// {
	// 	nome: 'Agilizar Processos Imobiliários',
	// 	email: 'agilizar@agilizarprocessos.com.br',
	// },
	// { nome: 'Âncora Imobiliária', email: 'vendas@ancoraimobiliaria.com.br' },
	// {
	// 	nome: 'APSA - Administração Predial e Negócios Imobiliários S/A',
	// 	email: 'boaviagem@apsa.com.br',
	// },
	// { nome: 'Arkos Gestão de Condomínios', email: 'contato@arkosadm.com.br' },
	// {
	// 	nome: 'Armando Nogueira Intermediação Imobiliária',
	// 	email: 'atendimento.imobian@gmail.com',
	// },
	// {
	// 	nome: 'Arrecifes Negócios Imobiliários',
	// 	email: 'arrecifes@arrecifes.com.br',
	// },
	// {
	// 	nome: 'Acta Administração Especializada',
	// 	email: 'gerente.operacional@actaadm.com.br',
	// },
	// { nome: 'Avellar Imóveis', email: 'avellarimoveis@avellarimoveis.com.br' },
	// { nome: 'BCI Imobiliária', email: 'comercial@bciimobiliaria.com.br' },
	// { nome: 'Bello Lar Imóveis', email: 'ffn@bellolarimoveis.com.br' },
	// { nome: 'Cedro Gestão Condominial', email: 'dirceu@cedrocondominios.com.br' },
	// { nome: 'Clean Terceirizações', email: 'comercial@cleanterceirizacoes.com' },
	// { nome: 'Comunidade Sólida', email: 'clientes@comunidadesolida.com.br' },
	// { nome: 'Condo Premium', email: 'adm@condopremium.com.br' },
	// {
	// 	nome: 'Cond. Pró-Indiviso Shopping Center Recife',
	// 	email: 'screcife@shopping-recife.com.br',
	// },
	// {
	// 	nome: 'Contelis Administração de Condomínios',
	// 	email: 'contato@contelis.com.br',
	// },
	// {
	// 	nome: 'Controlar Administração de Condomínios',
	// 	email: 'atendimento@controlarcondominios.com.br',
	// },
	// { nome: 'CTI Imobiliária', email: 'cti@ctiimobiliaria.com.br' },
	// { nome: 'DAC Administradora de Condomínios', email: 'contato@dac.adm.br' },
	// {
	// 	nome: 'Diego Carneiro - Negócios Imobiliários',
	// 	email: 'clientes@dcronegocios.com.br',
	// },
	// { nome: 'DCT Consultoria Imobiliaria', email: 'direct@directimoveis.com.br' },
	// continuar daqui
	// {
	// 	nome: 'Exclusive Assessoria Condominial',
	// 	email: 'contato@exclusiveassessoria.com.br',
	// },
	// { nome: 'Flash Assessoria Condominial', email: 'flashcond@globo.com' },
	// { nome: 'Fleischman Assessoria Imobiliária', email: 'adm@fleischman.com.br' },
	// { nome: 'GDR Administração', email: 'gdr@gdradministracao.com.br' },
	// {
	// 	nome: 'Gedeão Pontes Negócios Imobiliários',
	// 	email: 'gedeao@gedeaoimoveis.com.br',
	// },
	// {
	// 	nome: 'Holder Administração de Condomínios',
	// 	email: 'atendimento@holder.adm.br',
	// },
	// {
	// 	nome: 'Imobiliária Eduardo Feitosa',
	// 	email: 'vendas@eduardofeitosa.com.br',
	// },
	// { nome: 'Imóveis de Pernambuco', email: 'felipepessoademello@hotmail.com' },
	// {
	// 	nome: 'Inaldo Dantas Administração de Condomínios',
	// 	email: 'comercial@inaldodantas.com.br',
	// },
	// {
	// 	nome: 'Isabel Guedes Condomínios',
	// 	email: 'isabel@isabelguedescondominios.com.br',
	// },
	// { nome: 'M&C Condomínios', email: 'contato@meccondominios.com.br' },
	// { nome: 'Marvan Administradora', email: 'atendimento@marvanadm.com.br' },
	// { nome: 'Mega Gestão Condominial', email: 'megagestaocondominial@gmail.com' },
	// { nome: 'MG Imobiliária', email: 'locacao@mgimobiliaria.com.br' },
	// {
	// 	nome: 'Módulo Condomínios Adm. e Contabilidade',
	// 	email: 'modulo@moduloadm.com.br',
	// },
	// { nome: 'Moradasol', email: 'imobiliaria@moradasol.com.br' },
	// { nome: 'Moraes Administração de Imóveis', email: 'mail.moraes@gmail.com' },
	// { nome: 'Newville Imóveis', email: 'newville@newville.com.br' },
	// {
	// 	nome: 'Novo Horizonte Administração de Condomínios',
	// 	email: 'contato@admnovohorizonte.com.br',
	// },
	// { nome: 'Osvaldo & Filho Imóveis', email: 'osvaldo@osvaldofilho.com.br' },
	// {
	// 	nome: 'Paulo Miranda Empreendimentos',
	// 	email: 'paulomiranda@paulomiranda.com.br',
	// },
	// { nome: 'Precisa Prime', email: 'contato@precisaprime.com.br' },
	// { nome: 'Proimóvel Negócios Imobiliários', email: 'proimoveltda@uol.com.br' },
	// { nome: 'Rafcon Administradora', email: 'condominios@rafcon.com.br' },
	// { nome: 'Rivoli Gestão de Imóveis', email: 'comercial@rivoliimoveis.com.br' },
	// { nome: 'Rocha Imóveis', email: 'rochaimoveispe@gmail.com' },
	// {
	// 	nome: 'Select Administradora',
	// 	email: 'selectadm@selectadministradora.com.br',
	// },
	// {
	// 	nome: 'Semog Administradora de Condomínios',
	// 	email: 'semog.pe@semogcondominios.com.br',
	// },
	// { nome: 'SFCJ-Consult', email: 'contato@sfcjconsult.com' },
	// {
	// 	nome: 'Shopping Center Boa Vista',
	// 	email: 'pessoal@shoppingboavista.com.br',
	// },
	// { nome: 'Shopping Center Recife', email: 'dp@shoppingrecife.com.br' },
	// { nome: 'Shopping Center Tacaruna', email: 'shopping@tacaruna.com.br' },
	// { nome: 'Shopping Guararapes', email: 'sup@shopping-guararapes.com.br' },
	// { nome: 'Síndico Prime', email: 'adm@sindicoprime.com.br' },
	// { nome: 'Tânia Macêdo Imóveis', email: 'tania@taniamacedoimoveis.com.br' },
	// {
	// 	nome: 'Techmetria Medição Individualizada',
	// 	email: 'falecom@techmetria.com.br',
	// },
	// { nome: 'True Imobiliária', email: 'danielaaraujo@trueimoveis.com.br' },
	// {
	// 	nome: 'Unigov Gestão de Bens e Empreendimentos',
	// 	email: 'julio@unigovgestao.com',
	// },
	// { nome: 'Zygmunt Katz Imobiliária', email: 'zykatz@zykatz.com.br' },
	// { nome: 'P&R Condomínios', email: 'atendimento@peradministradora.com.br' },
];

function registerRoutersEmails(server: Server) {
	const base = server.basePath('/send-email');

	base.get('/accounting', async (ctx) => {
		for (const contact of contactsAccounting) {
			await ctx.email.emails.send(
				{
					subject:
						'Parceria comercial - Escritório de Contabilidade e a SEGWISE / XCAR CORRETORA DE SEGUROS',
					from: 'XCAR Corretora <parceria@emails.xcarcorretora.com.br>',
					to: contact.email.toLowerCase(),
					react: TemplatePartnershipInviteAccounting(),
				},
				{
					idempotencyKey: `partnership:invite:accounting:${contact.email}`,
				},
			);
		}

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});

	base.get('/condominium', async (ctx) => {
		for (const contact of contactsCondominium) {
			await ctx.email.emails.send(
				{
					subject:
						'Parceria comercial - Administradora de condomínio e a SEGWISE / XCAR CORRETORA DE SEGUROS',
					from: 'XCAR Corretora <parceria@emails.xcarcorretora.com.br>',
					to: contact.email.toLowerCase(),
					react: TemplatePartnershipInviteCondominium(),
				},
				{
					idempotencyKey: `partnership:invite:condominium:${contact.email}`,
				},
			);
		}

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});
}

export { registerRoutersEmails };
