import { fakerPT_BR as faker } from '@faker-js/faker';
import { SchemaProducerSimple } from '@segwise/core/schemas';
import type { Server } from '@/@types/server.d';

function registerRoutersServicesProducersListiningSimple(server: Server) {
	server.get('/simple', async (ctx) => {
		const data = Array(faker.number.int({ min: 5, max: 10 }))
			.fill(null)
			.map(() =>
				SchemaProducerSimple.parse({
					id: Bun.randomUUIDv7(),
					name: faker.person.fullName().toLowerCase(),
					contact: {
						email: faker.internet.email(),
						phone: `${faker.number.int({ min: 10, max: 99 })}9${faker.phone.number({ style: 'international' }).slice(-8)}`,
					},
				}),
			);

		return ctx.json(data, 200);
	});
}

export { registerRoutersServicesProducersListiningSimple };
