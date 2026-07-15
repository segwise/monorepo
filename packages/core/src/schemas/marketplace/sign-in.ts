import z from 'zod';
import { SchemaBirth, SchemaCPF } from '../utils';

const SchemaMarketplaceSignIn = z
	.object({
		company: z.uuidv7('ID da corretora inválido').nullish(),
		cpf: SchemaCPF,
		birth: SchemaBirth,
	})
	.strict();

export { SchemaMarketplaceSignIn };
