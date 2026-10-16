// Enxuga o node_modules de PRODUÇÃO da api dentro do Docker (estágio prod-deps; ver o Dockerfile).
//
// Instalação isolada do Bun: cada pacote fica em node_modules/.bun/<id>/node_modules/<nome> e as
// dependências dele são os links ao lado (node_modules/.bun/<id>/node_modules/*). O script parte das
// dependências dos workspaces, segue esses links e apaga o que não for alcançado. Algumas arestas são
// cortadas de propósito (EXCLUDED_EDGES): dependências que existem para ferramentas de linha de comando
// ou integrações que a api nunca carrega em produção. O estágio `verify` do Dockerfile empacota a api com
// `bun build` contra o node_modules resultante: se algo que o código importa tiver sumido, o build falha.
//
// Uso: bun scripts/prune-node-modules.ts <raiz do monorepo podado>
import {
	existsSync,
	lstatSync,
	readdirSync,
	realpathSync,
	rmSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.argv[2] ?? '.';
const store = join(root, 'node_modules/.bun');

const WORKSPACES = ['apps/api', 'packages/core', 'packages/database'];

// pacote -> dependências dele que NÃO são seguidas.
const EXCLUDED_EDGES: Record<string, string[]> = {
	// O pacote `react-email` junta os componentes (usados pelos templates de e-mail) e o CLI de
	// preview `email` (nunca executado em produção). Só o CLI usa estes; os componentes importam
	// apenas react, css-tree, tailwindcss, prismjs, marked e @react-email/render.
	'react-email': [
		'@babel/parser',
		'@babel/traverse',
		'chokidar',
		'commander',
		'conf',
		'debounce',
		'esbuild',
		'glob',
		'jiti',
		'log-symbols',
		'mime-types',
		'normalize-path',
		'nypm',
		'picospinner',
		'prompts',
		'socket.io',
		'tsconfig-paths',
	],
	// Peers opcionais: a integração com Next.js (a api usa o better-auth com Hono; com o `next` vinham o
	// `sharp`/libvips e os binários SWC) e o CLI do Prisma (o adapter usa o client, não o CLI).
	'better-auth': ['next', 'prisma'],
	'@better-auth/prisma-adapter': ['prisma'],
	// O client do Prisma declara o CLI como peer opcional; quem precisa do CLI são as migrations.
	'@prisma/client': ['prisma'],
};

// Nunca vão para produção, venham de onde vierem: o TypeScript só é usado no build e no typecheck
// (o Bun executa .ts sem ele); entra como peer de vários pacotes.
const EXCLUDED_PACKAGES = new Set(['typescript']);

// Dependências diretas de um workspace que não vão para a imagem da api (PRUNE_WITHOUT_PRISMA_CLI=1
// quando as migrations rodam numa imagem própria e a api não precisa mais do CLI do Prisma).
const EXCLUDED_WORKSPACE_DEPS: Record<string, string[]> =
	process.env.PRUNE_WITHOUT_PRISMA_CLI === '1'
		? { 'packages/database': ['prisma'] }
		: {};

function linksOf(dir: string): string[] {
	if (!existsSync(dir)) return [];

	const out: string[] = [];

	for (const entry of readdirSync(dir)) {
		if (entry === '.bin') continue;

		const path = join(dir, entry);

		if (entry.startsWith('@') && !lstatSync(path).isSymbolicLink()) {
			for (const scoped of readdirSync(path)) out.push(`${entry}/${scoped}`);
		} else {
			out.push(entry);
		}
	}

	return out;
}

// Diretório node_modules/.bun/<id> de um pacote resolvido (ou undefined se não está no store).
function storeEntry(realPath: string): string | undefined {
	const rel = relative(store, realPath);

	if (rel.startsWith('..')) return undefined;

	return rel.split(sep)[0];
}

const kept = new Set<string>();
const queue: Array<{ id: string; name: string }> = [];

function visit(fromDir: string, name: string) {
	const link = join(fromDir, name);

	if (EXCLUDED_PACKAGES.has(name)) return;
	if (!existsSync(link)) return; // dependência opcional não instalada nesta plataforma

	const id = storeEntry(realpathSync(link));

	if (!id || kept.has(id)) return;

	kept.add(id);
	queue.push({ id, name });
}

for (const workspace of WORKSPACES) {
	const dir = join(root, workspace, 'node_modules');

	const excluded = new Set(EXCLUDED_WORKSPACE_DEPS[workspace] ?? []);

	for (const name of linksOf(dir)) {
		if (!excluded.has(name)) visit(dir, name);
	}
}

while (queue.length) {
	const { id, name } = queue.shift() as { id: string; name: string };
	const siblings = join(store, id, 'node_modules');
	const excluded = new Set(EXCLUDED_EDGES[name] ?? []);

	for (const dep of linksOf(siblings)) {
		if (dep === name || excluded.has(dep)) continue;

		visit(siblings, dep);
	}
}

let removed = 0;

for (const id of readdirSync(store)) {
	if (id === 'node_modules' || kept.has(id)) continue;

	rmSync(join(store, id), { recursive: true, force: true });
	removed++;
}

// Links da pasta de "hoisting" (node_modules/.bun/node_modules) que apontavam para o que saiu.
const hoisted = join(store, 'node_modules');

for (const name of linksOf(hoisted)) {
	const link = join(hoisted, name);

	if (!existsSync(link)) rmSync(link, { force: true });
}

console.log(`prune: ${kept.size} pacotes mantidos, ${removed} removidos`);
