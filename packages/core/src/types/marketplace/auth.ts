import type z from 'zod';

import type { SchemaMarketplaceSignIn } from '../../schemas/marketplace/sign-in';

type MarketplaceSignIn = z.infer<typeof SchemaMarketplaceSignIn>;

export type { MarketplaceSignIn };
