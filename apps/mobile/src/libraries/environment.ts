import type { Environment } from '@/@types/environment';
import { SchemaEnvironment } from './schemas/environment';

const environment = SchemaEnvironment.parse({
	API_URL: process.env.EXPO_PUBLIC_API_URL as string,
} satisfies Environment);

export { environment };
