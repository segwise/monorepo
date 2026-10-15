import type { ErrorHandler } from 'hono';
import { XiorError } from 'xior';

const errorMiddleware: ErrorHandler = (error, ctx) => {
	let message = error.message;

	if (error instanceof XiorError) {
		console.error('Erro capturado:', error.response?.data, ctx.req.path);

		if (error.response?.data?.message) {
			message = error.response?.data?.message;
		}
	} else {
		console.error(`Erro capturado: ${error.message} | ${ctx.req.path}`);
	}

	return ctx.json(
		{
			error: 'Erro interno do servidor',
			message,
		},
		500,
	);
};

export { errorMiddleware };
