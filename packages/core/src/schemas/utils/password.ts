import z from 'zod';

const SchemaPasswordDefault = z
	.string('Senha inválida')
	.min(1, 'Informe a senha');

const SchemaPasswordLengthMin = SchemaPasswordDefault.min(
	8,
	'Mínimo 8 caracteres',
);

const SchemaPasswordLengthMax = SchemaPasswordDefault.max(
	128,
	'Máximo 128 caracteres',
);

const SchemaPasswordIncludeUppercase = SchemaPasswordDefault.refine(
	(val) => /[A-Z]/.test(val),
	'A senha deve conter pelo menos uma letra maiúscula',
);

const SchemaPasswordIncludeNumber = SchemaPasswordDefault.refine(
	(val) => /\d/.test(val),
	'A senha deve conter pelo menos um número',
);

const SchemaPasswordIncludeSpecial = SchemaPasswordDefault.refine(
	(val) => /[^A-Za-z0-9]/.test(val),
	'A senha deve conter pelo menos um caractere especial',
);

const SchemaPassword = z.intersection(
	SchemaPasswordDefault,
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
	SchemaPasswordDefault,
	z.intersection(SchemaPasswordLengthMin, SchemaPasswordLengthMax),
);

export {
	SchemaPassword,
	SchemaPasswordConfirm,
	SchemaPasswordDefault,
	SchemaPasswordIncludeNumber,
	SchemaPasswordIncludeSpecial,
	SchemaPasswordIncludeUppercase,
	SchemaPasswordLengthMax,
	SchemaPasswordLengthMin,
};
