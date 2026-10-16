// Só para gerar o CSS dos PDFs (ver scripts/build-pdf-styles.ts). Os templates são strings dentro
// das rotas de impressão, então o Tailwind lê esses arquivos para saber quais classes existem.
/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/routers/services/safes/print.ts',
		'./src/routers/services/quotes/[[]id]/print.ts',
		'./src/routers/services/marketing/print-contacts.ts',
	],
	theme: { extend: {} },
	plugins: [],
};
