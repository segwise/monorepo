import type z from 'zod';

import type { SchemaMarketplaceSignIn } from '../../schemas/financing/auth';

type MarketplaceSignIn = z.infer<typeof SchemaMarketplaceSignIn>;

export type { MarketplaceSignIn };
