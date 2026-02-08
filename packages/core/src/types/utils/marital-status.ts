import type z from 'zod';
import type { SchemaMaritalStatus } from '../../schemas';

type MaritalStatus = z.infer<typeof SchemaMaritalStatus>;

export type { MaritalStatus };
