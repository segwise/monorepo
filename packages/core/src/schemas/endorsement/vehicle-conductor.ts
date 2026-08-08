import { z } from 'zod';
import { getNumericValue } from '../../utils';
import { SchemaCPF, SchemaPlate } from '../utils';

const SchemaEndorsementVehicleConductor = z.object({
	plate: SchemaPlate.nullish(),
	model: z.string('Modelo do veículo inválido'),
	modelYear: z.string('Ano do modelo do veículo inválido'),
	driver: SchemaCPF,
	amount: z
		.string('Valor inválido')
		.transform(getNumericValue)
		.or(z.coerce.number('Frânquia inválido').min(1, 'Frânquia inválido'))
		.refine((value) => value > 0, 'Frânquia inválido'),
	percentage: z
		.string('Percentual inválido')
		.transform(getNumericValue)
		.refine((val) => val >= 0 && val <= 100, {
			message: 'Percentual inválido',
		})
		.or(
			z.coerce
				.number('Percentual inválido')
				.min(0, 'Percentual inválido')
				.max(100, 'Percentual inválido'),
		),
});

export { SchemaEndorsementVehicleConductor };
