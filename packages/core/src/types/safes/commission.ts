import type z from 'zod';
import type { SchemaSafeCommission } from '../../schemas/safes';

type SafeCommission = z.infer<typeof SchemaSafeCommission>;

type SafeCommissionType = z.infer<typeof SchemaSafeCommission.shape.type>;

export type { SafeCommission, SafeCommissionType };
