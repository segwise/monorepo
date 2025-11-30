import { SchemaEnvironment } from './schemas/environment';

const envs = {
	...Bun.env,
	BETTER_AUTH_URL: JSON.parse(Bun.env.BETTER_AUTH_URL as string),
};

const environment = SchemaEnvironment.parse(envs);

export { environment };
