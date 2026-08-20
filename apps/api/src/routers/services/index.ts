import type { Server } from '@/@types/server.d';
import { registerRoutersServicesAnalytics } from '@/routers/services/analytics';
import { registerRoutersServicesAuth } from '@/routers/services/auth';
import { registerRoutersServicesCpfOrCnpj } from '@/routers/services/cpf-or-cnpj';
import { registerRoutersServicesPayments } from '@/routers/services/payments';
import { registerRoutersServicesProducers } from '@/routers/services/producers';
import { registerRoutersServicesQuotes } from '@/routers/services/quotes';
import { registerRoutersServicesSafes } from '@/routers/services/safes';
import { registerRoutersServicesUtils } from '@/routers/services/utils';
import { registerRoutersServicesVehicles } from '@/routers/services/vehicles';
import { TemplatePartnershipInviteAccounting } from '../../templates/partnership-invite/accounting';
import { TemplatePartnershipInviteCondominium } from '../../templates/partnership-invite/condominium';
import { registerRoutersServicesEndorsements } from './endorsements';
import { registerRoutersServicesMarketplace } from './marketplace';
import { registerRoutersServicesPIX } from './pix';
import { registerRoutersServicesQuoteFinancing } from './quote-financing';
import { registerRoutersServicesWebhooks } from './webhooks';

type Contato = {
	nome: string;
	email: string;
};

const contatosWebnode: Contato[] = [
	{
		nome: '100 Porcento Audit - Auditores Independentes S/S',
		email: 'fcaldas@100porcento.srv.br',
	},
	{
		nome: 'A Contabil Servicos de Contabilidade Ltda',
		email: 'alvoradaltda@uol.com.br',
	},
	{
		nome: 'A R de Macedo Servicos Contabeis Eireli',
		email: 'sac@agmconsultoria.com',
	},
	{
		nome: 'Absoluta Contabilidade',
		email: 'absoluta@absolutacontabilidade.com.br',
	},
	{
		nome: 'AC Consult Gestao em Contabilidade Ltda',
		email: 'erikacomunicacao@hotmail.com',
	},
	{
		nome: 'Acene Assessoria Contabil e Consul. Emp. do NE',
		email: 'carmelo@acenecontabilidade.com.br',
	},
	{
		nome: 'Acerto Contadores Associados Ltda',
		email: 'claudetecontabil@yahoo.com.br',
	},
	{
		nome: 'Age Consulting Serv de Apoio Adm e Cont Ltda',
		email: 'sergio@ageconsulting.com.br',
	},
	{ nome: 'Agenda Empresarial Ltda - EPP', email: 'alba@agenda.com.br' },
	{
		nome: 'AGF Contabil e Treinamento Empresarial Ltda-EPP',
		email: 'agf.pe2@agfconsultores.com.br',
	},
	{ nome: 'Agir Assessoria Empresarial Ltda.', email: 'ronaldo@agir.com.br' },
	{
		nome: 'AGS Assessoria e Gerência de Sistemas Ltda',
		email: 'agstca@uol.com.br',
	},
	{ nome: 'Albani José Ribeiro de Lima', email: 'albanilima@zipmail.com.br' },
	{ nome: 'Alberto Pinto Vilaça de Lima', email: 'albertovilaca@bol.com.br' },
	{ nome: 'Alec Contábil Ltda.', email: 'adelvanialec@alec.com.br' },
	{ nome: 'Art Conta', email: 'eduardoanjos2012@hotmail.com' },
	{
		nome: 'ARV Auditores e Consultores Independentes Ltda',
		email: 'secretaria@arvauditores.com.br',
	},
	{
		nome: 'Asisconta - Ass. Contabil e Fiscal S/C Ltda.',
		email: 'gqueiros@assconta.com.br',
	},
	{
		nome: 'Ativa Contabil e Processamento de Dados Ltda - ME',
		email: 'cida@emcconsultoria.combr',
	},
	{
		nome: 'Audiccon - Auditoria & Consultoria Contabil Ltda - ME',
		email: 'adrianamoura@audiccon.com.br',
	},
	{
		nome: 'Bacelar Cavalcanti Assessoria Contabil',
		email: 'daniel@bacelaralbuquerque.com.br',
	},
	{ nome: 'Base Servicos Contabeis Ltda', email: 'ratis@baseconsultoria.net' },
	{ nome: 'Bernhoeft Auditores Ltda', email: 'jleite@bernhoeft.com.br' },
	{
		nome: 'BGN Consultores em Contabilidade Ltda',
		email: 'flavio@bgncontabilidade.com.br',
	},
	{
		nome: 'BKR - Lopes, Machado Auditores e Consultores Ltda - EPP',
		email: 'mguerra@bkr-lopesmachado.com.br',
	},
	{
		nome: 'BM4 Consultoria Contabil',
		email: 'bm4consultoriacontabil@gmail.com',
	},
	{
		nome: 'Campos & Garcia Cons. e Contad. Associados',
		email: 'camposegarcia@camposegarcia.com.br',
	},
	{
		nome: 'Carvalho Assessoria Contabil',
		email: 'carvalhoassessoria@hotmail.com',
	},
	{
		nome: 'Centro de Estudos Contabeis Ltda',
		email: 'profcesario@hotmail.com',
	},
	{ nome: 'Conasc Contadores Associados Ltda', email: 'contato@conasc.com.br' },
	{ nome: 'Conascont - Contabilidade Ltda', email: 'alberto@conascont.com.br' },
	{
		nome: 'Conase - Contabilidade e Assessoria de Empresas Ltda',
		email: 'conasepimentel@hotmail.com',
	},
	{
		nome: 'Confisco Contabilidade Ltda ME',
		email: 'franciscopazjr@hotmail.com',
	},
	{
		nome: 'Consercon Processamento de Dados Limitada - ME',
		email: 'consercon@consercon.com.br',
	},
	{
		nome: 'Consplan Assessoria e Planejamento Ltda',
		email: 'jaugusmarinho@hotmail.com',
	},
	{
		nome: 'Consultserv - Consultoria e Servicos de Contabilidade do Nordeste Ltda',
		email: 'diretoria@cscne.com.br',
	},
	{
		nome: 'Conta Mais - Servicos de Contabilidade Ltda',
		email: 'contamais@globo.com',
	},
	{ nome: 'Contadores Independentes Ltda', email: 'silcel5@hotmail.com' },
	{
		nome: 'Contar Contadores Associados Ltda',
		email: 'joao.borba@contarweb.com.br',
	},
	{
		nome: 'Continf - Contabilidade Informatizada Ltda',
		email: 'continf@uol.com.br',
	},
	{
		nome: 'Contline Assessoria Contábil Ltda',
		email: 'erikaraujo@contline.srv.br',
	},
	{
		nome: 'Controllers Assessoria e Consultoria Contabil Ltda',
		email: 'elaine@controllersbr.com',
	},
	{
		nome: 'Contserv Contabilidade e Serviços Ltda - ME',
		email: 'contserv@elogica.com.br',
	},
	{
		nome: 'Coutinho Contadores Ltda',
		email: 'fabio@coutinhocontadores.com.br',
	},
	{
		nome: 'Directivos S/C Contadores Assoc Ltda.',
		email: 'directivos@directivos.com.br',
	},
	{
		nome: 'Dom Contabil - Contabilidade Auditoria e Assessoria Ltda',
		email: 'domcont@hotmail.com',
	},
	{
		nome: 'Edileila Silva Barbosa ME',
		email: 'edileila.contabilidade@hotmail.com',
	},
	{
		nome: 'Edson & Roger Melo Assessoria Contábil S/S',
		email: 'edson.roger@terra.com.br',
	},
	{
		nome: 'Efata Contabilidade e Consultoria Ltda - ME',
		email: 'erika.contabilidade@efatacontabilidade.com.br',
	},
	{ nome: 'Elohim Assessoria Contabil', email: 'socorro@elohim.cnt.br' },
	{
		nome: 'Emecinco Contabilidade e Serviços',
		email: 'emecinco@emecinco.com.br',
	},
	{ nome: 'ERS Contabilidade', email: 'emanuel@erscontabil.com.br' },
	{
		nome: 'Escritecont Assessoria Contabil Ltda',
		email: 'escritecont@terra.com.br',
	},
	{
		nome: 'Expertise Auditoria e Consultoria Ltda.',
		email: 'expertise@expertiseauditoria.com',
	},
	{
		nome: 'Faros Assessoria Contabil e Empresarial Ltda - ME',
		email: 'fabio.roberto@faros.com.br',
	},
	{
		nome: 'Finanza Consultoria & Contabilidade',
		email: 'finanza@finanza.cnt.br',
	},
	{
		nome: 'G G B Assessoria Contabil, Fiscal e Trabalhista Ltda',
		email: 'fiscal@brumarcontabil.com.br',
	},
	{ nome: 'G7 Contabilidade Ltda', email: 'g7contabilidade@uol.com.br' },
	{
		nome: 'Gerencial Consultores Associados Ltda',
		email: 'italo@gerencialconsultores.com',
	},
	{
		nome: 'GS & Carvalho Assessoria Contabil Ltda',
		email: 'carlomanojunior@terra.com.br',
	},
	{
		nome: 'HVR Soluções em Contabilidade Ltda ME',
		email: 'contato@hvrcontabil.com.br',
	},
	{
		nome: 'Ivo Barboza & Advogados Associados',
		email: 'ivolima@ivobarbozaadv.com.br',
	},
	{ nome: 'J Barros Contabilidade S/C Ltda', email: 'jrd.barros@gmail.com' },
	{
		nome: 'J. Silva Assessoria Ltda',
		email: 'alexandre@jsilvacontabil.com.br',
	},
	{ nome: 'JBC Assessoria Contábil Ltda.', email: 'jbc@hotlink.com.br' },
	{ nome: 'JC Buarque Contabilidade', email: 'diretoria@jcbuarque.com.br' },
	{ nome: 'JFA Contabilidade Ltda - ME', email: 'pessoal.jfa@gmail.com' },
	{
		nome: 'JFS Servicos de Contabilidade Ltda',
		email: 'josefelix@jfsauditores.com.br',
	},
	{
		nome: 'JMSA Gestao & Servicos Contabeis Ltda - EPP',
		email: 'michelle@jmsa-pe.com.br',
	},
	{
		nome: 'Jose Miguel Arcanjo Filho',
		email: 'miguelarcanjo@contabilservice.cnt.br',
	},
	{ nome: 'Leverrier Assessoria Contabil Ltda', email: 'leverrier@uol.com.br' },
	{ nome: 'Lex Cora S/C Ltda.', email: 'christian@lexcora.com.br' },
	{
		nome: 'LGLuz Assessoria Empresarial Ltda',
		email: 'lgluzassessoria@uol.com.br',
	},
	{
		nome: 'Lira & Santos Contadores Associados S/S',
		email: 'silvioliracontas@hotmail.com',
	},
	{
		nome: 'Maria Silva Contabilidade',
		email: 'mariasilvacontabilidade@gmail.com',
	},
	{
		nome: 'M & W Assessoria Empresarial Ltda',
		email: 'mw@mwassessoria.com.br',
	},
	{ nome: 'Melo & Brasil Ltda.', email: 'melobrasil@uol.com.br' },
	{
		nome: 'MESPR - Assessoria Empresarial e Contabil Ltda',
		email: 'mespr@mespr.com.br',
	},
	{
		nome: 'Meta Contadores Associados Ltda',
		email: 'reinaldomendes@hotmail.com',
	},
	{
		nome: 'Mota e Carvalho Contabilidade Ltda',
		email: 'katiuscia@meccontabilidade.com.br',
	},
	{
		nome: 'Multicont Contabilidade e Consultoria S/C',
		email: 'silvamulticont@aol.com',
	},
	{
		nome: 'Multicontábil do Nordeste Ltda.',
		email: 'multicontabil@multicontabil.cnt.br',
	},
	{
		nome: 'Nascimento Assessoria Contabil e Servicos Ltda',
		email: 'joana@nascont.com.br',
	},
	{
		nome: 'Nassau Auditores e Consultores Associados S/C Ltda.',
		email: 'nassau.audit@terra.com.br',
	},
	{ nome: 'Tecjur Ltda', email: 'almir@tecjur.com.br' },
];

function registerRoutersServices(server: Server) {
	const base = server.basePath('/services');

	registerRoutersServicesAuth(base);
	registerRoutersServicesUtils(base);
	registerRoutersServicesQuoteFinancing(base);
	registerRoutersServicesMarketplace(base);

	registerRoutersServicesPIX(base);

	registerRoutersServicesVehicles(base);

	registerRoutersServicesSafes(base);

	registerRoutersServicesProducers(base);
	registerRoutersServicesCpfOrCnpj(base);
	registerRoutersServicesQuotes(base);
	registerRoutersServicesAnalytics(base);
	registerRoutersServicesPayments(base);

	registerRoutersServicesEndorsements(base);

	registerRoutersServicesWebhooks(base);

	base.post('/', async (ctx) => {
		await ctx.email.emails.send({
			subject:
				'Parceria comercial - Escritório de Contabilidade e a SEGWISE / XCAR CORRETORA DE SEGUROS',
			from: 'XCAR Corretora <parceria@emails.segwise.com.br>',
			to: 'fernando.sena_@hotmail.com',
			react: TemplatePartnershipInviteAccounting(),
		});

		await ctx.email.emails.send({
			subject:
				'Parceria comercial - Administradora de condomínio e a SEGWISE / XCAR CORRETORA DE SEGUROS',
			from: 'XCAR Corretora <parceria@emails.segwise.com.br>',
			to: 'fernando.sena_@hotmail.com',
			react: TemplatePartnershipInviteCondominium(),
		});

		return ctx.json(
			{
				ok: true,
			},
			200,
		);
	});
}

export { registerRoutersServices };
