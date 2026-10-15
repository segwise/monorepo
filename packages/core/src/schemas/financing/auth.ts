import z from 'zod';
import { SchemaBirth, SchemaCPF } from '../utils';

const SchemaMarketplaceSignIn = z
	.object({
		cpf: SchemaCPF,
		birth: SchemaBirth,
	})
	.strict();
export { SchemaMarketplaceSignIn };
