import { zValidator } from '@hono/zod-validator';
import { SchemaCPF } from '@segwise/core/schemas';
import z from 'zod';
import type { Server } from '@/@types/server.d';
import { documentByCPF } from '@/functions/document/by-cpf';

function registerRoutersServicesCPF(server: Server) {
	server.get(
		'/:cpf{^[0-9]{11}$}',
		zValidator(
			'param',
			z.object(
				{
					cpf: SchemaCPF,
				},
				'Parâmetros de consulta inválidos',
			),
		),
		async (ctx) => {
			const { cpf } = ctx.req.valid('param');

			const document = await documentByCPF(cpf);

			return ctx.json(document, 200);
		},
	);
}

export { registerRoutersServicesCPF };
