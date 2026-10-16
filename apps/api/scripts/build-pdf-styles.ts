// Gera src/libraries/pdf/styles.generated.ts: o CSS do Tailwind dos PDFs, compilado de antemão.
// Antes os templates carregavam https://cdn.tailwindcss.com a cada PDF (dependência externa em
// tempo de execução). Rode `bun run pdf:styles` ao mudar classes nos templates; o CI confere se
// o arquivo gerado está em dia.
import { join } from 'node:path';

const root = join(import.meta.dir, '..');

const result = Bun.spawnSync(
	[
		'bunx',
		'tailwindcss',
		'-c',
		'tailwind.pdf.config.js',
		'-i',
		'src/libraries/pdf/tailwind.css',
		'--minify',
	],
	{ cwd: root, stderr: 'inherit' },
);

if (result.exitCode !== 0) {
	process.exit(result.exitCode ?? 1);
}

const css = result.stdout.toString().trim();

await Bun.write(
	join(root, 'src/libraries/pdf/styles.generated.ts'),
	`// Gerado por scripts/build-pdf-styles.ts. Não edite à mão.\nconst PDF_STYLES = ${JSON.stringify(css)};\n\nexport { PDF_STYLES };\n`,
);

console.log(`styles.generated.ts: ${css.length} bytes de CSS`);
