import type z from 'zod';
import type { SchemaSafeRegister } from '../../schemas/safes';

type SafeRegister = z.infer<typeof SchemaSafeRegister>;

export type { SafeRegister };
