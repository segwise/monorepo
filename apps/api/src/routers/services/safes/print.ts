import { zValidator } from '@hono/zod-validator';
import { SchemaSearchParamsSafeSimple } from '@segwise/core/schemas';
import { format } from 'date-fns';
import hbs from 'handlebars';
import { PDFDocument } from 'pdf-lib';
import z from 'zod';
import type { Server } from '@/@types/server.d';
import { selectPrisma } from '@/db-adapters/safe/print';
import { serializer } from '@/db-serializers/safe/print';
import { buildSafeSimpleWhere } from './build-safe-simple-where';

// Sem teto de registros por pedido explícito do usuário: a impressão tem
// que sair com tudo que bate no filtro, não importa o volume.
const htmlText = `
  <html lang='pt-BR'>
    <head>
      <meta charset='UTF-8' />
      <title>{{title}}</title>
      <script src='https://cdn.tailwindcss.com'></script>
    </head>
    <body class='p-3 text-black'>
      <table class='w-full text-xs border-collapse'>
        <tbody>
          <tr>
            <td colspan='7' class='border border-black px-1 py-0.5'>
              <div class='flex flex-row items-stretch justify-between'>
                <div>
                  <span class='text-lg font-extrabold uppercase'>{{brokerName}}</span>
                  <span class='block text-xs'>Relatório</span>
                </div>
                <div class='text-right text-xs leading-relaxed border-l border-black pl-1.5'>
                  {{#if periodLabel}}<div><b>Período:</b> {{periodLabel}}</div>{{/if}}
                  <div><b>Registros:</b> {{total}}</div>
                </div>
              </div>
            </td>
          </tr>
          <tr class='text-left'>
            <th class='border border-black px-1 py-0.5 text-center w-8'>#</th>
            <th class='border border-black px-1 py-0.5 text-center w-20'>Vigência</th>
            <th class='border border-black px-1 py-0.5 text-center w-10'>Ano</th>
            <th class='border border-black px-1 py-0.5'>Segurado</th>
            <th class='border border-black px-1 py-0.5'>Produtor</th>
            <th class='border border-black px-1 py-0.5'>Seguradora</th>
            <th class='border border-black px-1 py-0.5 text-center w-12 font-bold'>%</th>
          </tr>
        </tbody>
        <tbody>
          {{#each rows}}
          <tr>
            <td class='border border-black px-1 py-0.5 text-center'>{{this.order}}</td>
            <td class='border border-black px-1 py-0.5 text-center'>{{this.expirationLabel}}</td>
            <td class='border border-black px-1 py-0.5 text-center'>{{#if this.firstInsuranceYear}}{{this.firstInsuranceYear}}{{else}}—{{/if}}</td>
            <td class='border border-black px-1 py-0.5 max-w-[260px] truncate'>{{this.insuredName}}</td>
            <td class='border border-black px-1 py-0.5'>{{this.producerName}}</td>
            <td class='border border-black px-1 py-0.5'>{{this.insuranceCompanyName}}</td>
            <td class='border border-black px-1 py-0.5 text-center'>{{this.commissionPercentage}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </body>
  </html>
`;

const compile = hbs.compile(htmlText);

// Formato compacto pedido pelo usuário: "Período: 00/00/0000 - 00/00/0000".
// Quando o filtro não é por vigência (busca ou ids explícitos), não há um
// período único pra mostrar — nesse caso a linha simplesmente não aparece.
function buildPeriodLabel(
	effectiveEffectivedAt: { start: Date; end: Date } | null,
) {
	if (!effectiveEffectivedAt) {
		return null;
	}

	return `${format(effectiveEffectivedAt.start, 'dd/MM/yyyy')} - ${format(effectiveEffectivedAt.end, 'dd/MM/yyyy')}`;
}

function registerRoutersServicesSafesPrint(server: Server) {
	server.get(
		'/print',
		zValidator(
			'query',
			SchemaSearchParamsSafeSimple.extend({
				isExternal: z
					.literal(['true', 'false'])
					.or(z.boolean())
					.transform((value) =>
						value === 'true' ? true : value === 'false' ? false : value,
					)
					.nullish(),
			}),
		),
		async (ctx) => {
			const query = ctx.req.valid('query');

			const { where, orderBy, brokerId, effectiveEffectivedAt } =
				await buildSafeSimpleWhere(query, ctx);

			const safes = await ctx.database.safe.findMany({
				where,
				orderBy,
				select: selectPrisma,
				relationLoadStrategy: 'join',
			});

			const broker = brokerId
				? await ctx.database.broker.findUnique({
						where: { id: brokerId },
						select: { name: true },
					})
				: null;

			// "Ano" = ano do primeiro seguro do segurado (independente do filtro
			// aplicado na listagem — é o histórico completo do segurado). Calculado
			// via groupBy + _min(requestedAt) só para os segurados que aparecem
			// nesta impressão, não a base inteira.
			const insuredIds = Array.from(
				new Set(
					safes
						.map((safe) => safe.insuredId)
						.filter((id): id is string => !!id),
				),
			);

			const temporaryInsuredIds = Array.from(
				new Set(
					safes
						.map((safe) => safe.temporaryInsuredId)
						.filter((id): id is string => !!id),
				),
			);

			const [firstByInsured, firstByTemporaryInsured] = await Promise.all([
				insuredIds.length
					? ctx.database.safe.groupBy({
							by: ['insuredId'],
							where: { insuredId: { in: insuredIds } },
							_min: { requestedAt: true },
						})
					: Promise.resolve([]),
				temporaryInsuredIds.length
					? ctx.database.safe.groupBy({
							by: ['temporaryInsuredId'],
							where: { temporaryInsuredId: { in: temporaryInsuredIds } },
							_min: { requestedAt: true },
						})
					: Promise.resolve([]),
			]);

			const firstInsuranceYearByInsuredId = new Map(
				firstByInsured
					.filter((row) => row.insuredId && row._min.requestedAt)
					.map((row) => [
						row.insuredId as string,
						(row._min.requestedAt as Date).getFullYear(),
					]),
			);

			const firstInsuranceYearByTemporaryInsuredId = new Map(
				firstByTemporaryInsured
					.filter((row) => row.temporaryInsuredId && row._min.requestedAt)
					.map((row) => [
						row.temporaryInsuredId as string,
						(row._min.requestedAt as Date).getFullYear(),
					]),
			);

			const rows = safes
				.map((safe) =>
					serializer(safe, {
						firstInsuranceYear:
							(safe.insuredId &&
								firstInsuranceYearByInsuredId.get(safe.insuredId)) ||
							(safe.temporaryInsuredId &&
								firstInsuranceYearByTemporaryInsuredId.get(
									safe.temporaryInsuredId,
								)) ||
							null,
					}),
				)
				.map((row, index) => ({ ...row, order: index + 1 }));

			const content = compile({
				brokerName: broker?.name || '',
				total: rows.length,
				periodLabel: buildPeriodLabel(effectiveEffectivedAt),
				rows,
			});

			const { page, release } = await ctx.browser();

			try {
				await page.setContent(content, {
					// Sem teto de registros, uma corretora grande pode gerar uma
					// tabela enorme — timeout generoso para dar tempo do Chromium
					// montar o layout inteiro antes de desistir.
					waitUntil: 'networkidle',
					timeout: 120000,
				});

				const pdfBuffer = await page.pdf({
					format: 'A4',
					printBackground: true,
					margin: {
						left: '6px',
						top: '6px',
						right: '6px',
						bottom: '6px',
					},
				});

				const pdf = await PDFDocument.load(pdfBuffer);

				pdf.setTitle(
					broker?.name ? `${broker.name} - relatório.pdf` : 'relatório.pdf',
				);
				pdf.setAuthor('SEGWISE TECNOLOGIA');
				pdf.setCreator('SEGWISE TECNOLOGIA');
				pdf.setLanguage('pt-BR');
				pdf.setCreationDate(new Date());

				return new Response(await pdf.save(), {
					headers: {
						'Content-Type': 'application/pdf',
					},
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

export { registerRoutersServicesSafesPrint };
