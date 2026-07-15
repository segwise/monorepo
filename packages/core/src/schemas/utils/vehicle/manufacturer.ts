import z from 'zod';

const SchemaVehicleManufacturer = z.object({
	id: z.uuidv7('ID da fabricante inválido'),
	name: z
		.string('Nome da fabricante inválido')
		.min(1, 'Nome da fabricante inválido'),
	icon: z.url('Ícone da fabricante inválido').nullish(),
	image: z.url('Logo da fabricante inválido').nullish(),
});

export { SchemaVehicleManufacturer };
