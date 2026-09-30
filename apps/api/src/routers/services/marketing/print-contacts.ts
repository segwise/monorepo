import { zValidator } from '@hono/zod-validator';
import { format } from 'date-fns';
import hbs from 'handlebars';
import { PDFDocument } from 'pdf-lib';
import z from 'zod';
import type { Server } from '@/@types/server';

// Lista para conferência manual em papel: só nome, e-mail e celular, mais
// campos em branco (responsável e celular do responsável) e um quadrado para
// marcar. Sem limite de linhas — sai tudo que veio do filtro da tela.
const htmlText = `
  <html lang='pt-BR'>
    <head>
      <meta charset='UTF-8' />
      <title>{{title}}</title>
      <script src='https://cdn.tailwindcss.com'></script>
    </head>
    <body class='text-black' style='margin: 0; padding: 12px;'>
      <div class='border border-black px-1 py-0.5 mb-1'>
        <div class='flex flex-row items-stretch justify-between'>
          <div>
            <span class='text-lg font-extrabold uppercase'>{{campaignName}}</span>
            <span class='block text-xs'>{{brokerName}} · Lista de contatos</span>
          </div>
          <div class='text-right text-xs leading-relaxed border-l border-black pl-1.5'>
            <div><b>Emitido em:</b> {{issuedAt}}</div>
            <div><b>Contatos:</b> {{total}}</div>
          </div>
        </div>
      </div>
      <table class='w-full text-xs border-collapse'>
        <thead>
          <tr class='text-left'>
            <th class='border border-black px-1 py-0.5 text-center w-8'>#</th>
            <th class='border border-black px-1 py-0.5'>Nome</th>
            <th class='border border-black px-1 py-0.5'>E-mail</th>
            <th class='border border-black px-1 py-0.5 w-28 whitespace-nowrap'>Celular</th>
            <th class='border border-black px-1 py-0.5 w-32'>Responsável</th>
            <th class='border border-black px-1 py-0.5 w-28 whitespace-nowrap'>Cel. responsável</th>
            <th class='border border-black px-1 py-0.5 text-center w-8'>OK</th>
          </tr>
        </thead>
        <tbody>
          {{#each rows}}
          <tr class='break-inside-avoid' style='height: 26px;'>
            <td class='border border-black px-1 py-0.5 text-center'>{{this.order}}</td>
            <td class='border border-black px-1 py-0.5'>{{this.name}}</td>
            <td class='border border-black px-1 py-0.5 whitespace-nowrap'>{{this.email}}</td>
            <td class='border border-black px-1 py-0.5 whitespace-nowrap'>{{this.phone}}</td>
            <td class='border border-black px-1 py-0.5'></td>
            <td class='border border-black px-1 py-0.5'></td>
            <td class='border border-black px-1 py-0.5 text-center'>
              <span style='display:inline-block; width:12px; height:12px; border:1.5px solid black;'></span>
            </td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </body>
  </html>
`;

const compile = hbs.compile(htmlText);

function maskPhoneBR(value: string | null) {
	if (!value) {
		return '';
	}

	const digits = value.replace(/\D/g, '');
	const local =
		digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;

	return local.length === 11
		? local.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
		: local.length === 10
			? local.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
			: local;
}

function registerRoutersServicesMarketingPrintContacts(server: Server) {
	// POST porque os ids vêm do que está filtrado na tela (pode ser muita coisa
	// para caber numa URL). A ordem dos ids é a ordem da impressão.
	server.post(
		'/campaigns/:id/contacts/print',
		zValidator('json', z.object({ ids: z.array(z.uuid()).min(1).max(20000) })),
		async (ctx) => {
			const brokerId = ctx.session.brokerId;
			const id = ctx.req.param('id') as string;
			const { ids } = ctx.req.valid('json');

			const campaign = brokerId
				? await ctx.database.marketingCampaign.findFirst({
						where: { id, brokerId },
						select: { name: true, broker: { select: { name: true } } },
					})
				: null;

			if (!campaign) {
				return ctx.json({ message: 'Campanha não encontrada' }, 404);
			}

			const contacts = await ctx.database.marketingContact.findMany({
				where: { campaignId: id, id: { in: ids } },
				select: { id: true, name: true, email: true, phone: true },
			});

			const byId = new Map(contacts.map((contact) => [contact.id, contact]));

			const rows = ids
				.map((contactId) => byId.get(contactId))
				.filter((contact) => !!contact)
				.map((contact, index) => ({
					order: index + 1,
					name: contact.name,
					email: contact.email,
					phone: maskPhoneBR(contact.phone),
				}));

			const content = compile({
				title: `${campaign.name} - contatos`,
				campaignName: campaign.name,
				brokerName: campaign.broker.name,
				issuedAt: format(new Date(), 'dd/MM/yyyy HH:mm'),
				total: rows.length,
				rows,
			});

			const { page, release } = await ctx.browser();

			try {
				await page.setContent(content, {
					waitUntil: 'networkidle',
					timeout: 120000,
				});

				const pdfBuffer = await page.pdf({
					format: 'A4',
					printBackground: true,
					margin: { left: '6px', top: '6px', right: '6px', bottom: '6px' },
				});

				const pdf = await PDFDocument.load(pdfBuffer);

				pdf.setTitle(`${campaign.name} - contatos.pdf`);
				pdf.setAuthor('SEGWISE TECNOLOGIA');
				pdf.setCreator('SEGWISE TECNOLOGIA');
				pdf.setLanguage('pt-BR');
				pdf.setCreationDate(new Date());

				return new Response(await pdf.save(), {
					headers: { 'Content-Type': 'application/pdf' },
					status: 200,
				});
			} catch {
				return ctx.json({ message: 'Erro ao gerar PDF' }, 500);
			} finally {
				await release();
			}
		},
	);
}

export { registerRoutersServicesMarketingPrintContacts };
