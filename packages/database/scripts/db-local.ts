// Roda o Prisma contra o banco de desenvolvimento LOCAL (URL em .env.dev-migrate,
// que não é versionado). A URL vai pelo ambiente do processo, que tem prioridade
// sobre o .env (que aponta para o banco remoto), e o script se recusa a rodar se
// o host não for local: migration em produção é feita só pelo deploy.
const file = Bun.file(new URL('../.env.dev-migrate', import.meta.url).pathname);

if (!(await file.exists())) {
	console.error(
		'Falta packages/database/.env.dev-migrate com DATABASE_URL do banco local.',
	);
	process.exit(1);
}

const line = (await file.text())
	.split('\n')
	.find((entry) => entry.startsWith('DATABASE_URL='));

const url = line?.slice('DATABASE_URL='.length).trim();

if (!url) {
	console.error('DATABASE_URL ausente em .env.dev-migrate.');
	process.exit(1);
}

const { hostname, port, pathname } = new URL(url);

if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) {
	console.error(`Recusado: o host "${hostname}" não é local.`);
	process.exit(1);
}

console.log(`[db-local] banco local ${hostname}:${port}${pathname}`);

const proc = Bun.spawn(['bun', 'x', '--bun', 'prisma', ...Bun.argv.slice(2)], {
	env: { ...process.env, DATABASE_URL: url },
	stdio: ['inherit', 'inherit', 'inherit'],
});

process.exit(await proc.exited);
