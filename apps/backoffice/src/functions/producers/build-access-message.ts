// Texto do acesso do parceiro para colar no WhatsApp: *negrito* e quebras de linha.
// Com `password` nulo (usuário que já tinha conta), a linha da senha avisa que vale
// a que ele já usa.
function buildAccessMessage({
	name,
	email,
	password,
	accessUrl,
}: {
	name: string;
	email: string;
	password: string | null;
	accessUrl: string;
}) {
	const firstName = name.trim().split(/\s+/)[0] ?? '';

	return [
		'*Acesso à plataforma Segwise*',
		'',
		`Olá${firstName ? `, ${firstName}` : ''}! Seu acesso foi criado.`,
		'',
		`*Login:* ${email}`,
		`*Senha:* ${password ?? 'a mesma que você já usa na Segwise'}`,
		'',
		`*Acesse:* ${accessUrl}`,
		'',
		`Antes do primeiro acesso, confirme seu e-mail pelo link que enviamos para ${email}.`,
	].join('\n');
}

export { buildAccessMessage };
