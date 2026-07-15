import z from 'zod';

const SchemaBasisOfAnalysis = z.enum(
	['year', 'month'],
	'Base de análise inválida',
);

export { SchemaBasisOfAnalysis };
