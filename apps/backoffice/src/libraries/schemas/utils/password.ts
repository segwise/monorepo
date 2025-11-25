import z from 'zod';

const SchemaDefault = z.string('Senha inválida');

const SchemaPasswordLengthMin = SchemaDefault.min(8, 'Mínimo 8 caracteres');

const SchemaPasswordLengthMax = SchemaDefault.max(30, 'Máximo 30 caracteres');

const SchemaPasswordIncludeUppercase = SchemaDefault.refine(
	(val) => /[A-Z]/.test(val),
	'A senha deve conter pelo menos uma letra maiúscula',
);

const SchemaPasswordIncludeNumber = SchemaDefault.refine(
	(val) => /\d/.test(val),
	'A senha deve conter pelo menos um número',
);

const SchemaPasswordIncludeSpecial = SchemaDefault.refine(
	(val) => /[^A-Za-z0-9]/.test(val),
	'A senha deve conter pelo menos um caractere especial',
);

const SchemaPassword = z.intersection(
	SchemaDefault,
	z.intersection(
		SchemaPasswordLengthMin,
		z.intersection(
			SchemaPasswordLengthMax,
			z.intersection(
				SchemaPasswordIncludeUppercase,
				z.intersection(
					SchemaPasswordIncludeNumber,
					SchemaPasswordIncludeSpecial,
				),
			),
		),
	),
);

const SchemaPasswordConfirm = z.intersection(
	SchemaDefault,
	z.intersection(SchemaPasswordLengthMin, SchemaPasswordLengthMax),
);

export {
	SchemaPassword,
	SchemaPasswordConfirm,
	SchemaPasswordLengthMin,
	SchemaPasswordLengthMax,
	SchemaPasswordIncludeUppercase,
	SchemaPasswordIncludeNumber,
	SchemaPasswordIncludeSpecial,
};
