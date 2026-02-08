import z from 'zod';
import { SchemaPostalCode } from './postal-code';

const SchemaAddress = z.object({
	street: z.string('Rua inválida').min(1, 'Rua inválida'),
	number: z.coerce.number('Número inválido').positive('Número inválido'),
	complement: z.string('Complemento inválido').nullish(),
	neighborhood: z.string('Bairro inválido').min(1, 'Bairro inválido'),
	city: z.string('Cidade inválida').min(1, 'Cidade inválida'),
	state: z.string('Estado inválido').min(1, 'Estado inválido'),
	postalCode: SchemaPostalCode,
});

export { SchemaAddress };
