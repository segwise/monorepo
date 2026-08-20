import type { Server } from '@/@types/server';

function registerRoutersRedirects(server: Server) {
	server.get('/nova-parceria', (ctx) => {
		return ctx.redirect(
			decodeURIComponent(
				'https://wa.me/5581986961991?text=Quero conversar sobre a parceria',
			),
			302,
		);
	});
}

export { registerRoutersRedirects };
