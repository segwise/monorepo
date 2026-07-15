import z, { type ZodType } from 'zod';

const parseJsonQuery = (schema: ZodType) =>
	z.string('JSON inválido').transform((val, ctx) => {
		try {
			return schema.parse(val);
		} catch {
			try {
				const parse = JSON.parse(val);
				return schema.parse(parse);
			} catch {
				ctx.addIssue({
					code: 'custom',
					message: 'JSON inválido',
				});
				return z.NEVER;
			}
		}
	});

export { parseJsonQuery };
