import type z from 'zod';
import type { SchemaProfessionSimple } from '../../schemas/professions/simple';

type ProfessionSimple = z.infer<typeof SchemaProfessionSimple>;

export type { ProfessionSimple };
