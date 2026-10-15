export * from './exchange';
export * from './manufacturer';
export * from './plate';
export * from './usage';

import z from 'zod';

import { SchemaVehicleExchange } from './exchange';
import { SchemaVehicleManufacturer } from './manufacturer';
import { SchemaPlate } from './plate';

const SchemaVehicle = z.object({
	id: z.uuidv7('ID do veículo'),
	plate: SchemaPlate,
	plateAlternative: SchemaPlate,
	manufacturer: SchemaVehicleManufacturer,
	model: z.string('Modelo inválido'),
	modelYear: z.coerce.number('Ano inválido'),
	exchange: SchemaVehicleExchange.nullish(),
	chassi: z.string('Chassi inválido').nullish(),
	image: z.url('Imagem inválida').nullish(),
});

export { SchemaVehicle };
