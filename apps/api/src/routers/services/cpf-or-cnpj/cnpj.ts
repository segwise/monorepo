import { zValidator } from '@hono/zod-validator';
import { SchemaCNPJ } from '@segwise/core/schemas';
import z from 'zod';
import type { Server } from '@/@types/server.d';
import { documentByCNPJ } from '@/functions/document/by-cnpj';

function registerRoutersServicesCNPJ(server: Server) {
	server.get(
		'/:cnpj{^[0-9]{14}$}',
		zValidator(
			'param',
			z.object(
				{
					cnpj: SchemaCNPJ,
				},
				'Parâmetros de consulta inválidos',
			),
		),
		async (ctx) => {
			const { cnpj } = ctx.req.valid('param');

			const document = await documentByCNPJ(cnpj);

			return ctx.json(document, 200);
		},
	);
}

export { registerRoutersServicesCNPJ };
