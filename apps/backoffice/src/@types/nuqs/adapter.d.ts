import type { z } from 'zod';

// biome-ignore lint/suspicious/noExplicitAny: any
type AnyZodObject = z.ZodObject<any>;

type InferShape<T extends AnyZodObject> = z.infer<T>;

type NuqsAdapterOptions<T extends AnyZodObject> = Partial<
	// biome-ignore lint/suspicious/noExplicitAny: any
	Record<keyof InferShape<T>, any>
>;

export type { NuqsAdapterOptions };
