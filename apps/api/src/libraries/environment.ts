import { SchemaEnvironment } from './schemas/environment';

const environment = SchemaEnvironment.parse(Bun.env);

export { environment };
