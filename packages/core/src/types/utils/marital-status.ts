import type z from 'zod';
import type { SchemaMaritalStatus } from '@/schemas/utils/marital-status';

type MaritalStatus = z.infer<typeof SchemaMaritalStatus>;

export type { MaritalStatus };
