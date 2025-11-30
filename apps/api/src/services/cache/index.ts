import { environment } from '@/libraries/environment';

const cache = new Bun.RedisClient(environment.CACHE_URL);

export { cache };
