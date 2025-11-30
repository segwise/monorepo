import type { SecondaryStorage } from 'better-auth';
import { cache } from '@/services/cache';

const secondaryStorage: SecondaryStorage = {
	get: async (key: string): Promise<string | null> => {
		const value = await cache.get(key);

		return value || null;
	},
	set: async (key: string, value: string, ttl?: number): Promise<void> => {
		if (ttl) {
			await cache.set(key, value, 'EX', ttl);
		} else {
			await cache.set(key, value);
		}
	},
	delete: async (key: string): Promise<void> => {
		await cache.del(key);
	},
};

export { secondaryStorage };
