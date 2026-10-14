import { mock } from 'bun:test';
import { appendFileSync } from 'node:fs';
const B = '/Users/juniormelo/Desktop/segwise/backend/src';
if (!String(process.env.DATABASE_URL).includes('localhost:55432')) throw new Error('banco errado');
const { render } = await import('react-email');
mock.module(`${B}/services/email/index.ts`, () => ({ email: { emails: { send: async (m: any) => {
	const html = String(await render(m.react));
	appendFileSync('/private/tmp/claude-501/-Users-juniormelo-Desktop-segwise-backoffice/368eae5f-5e4d-4105-b475-733456c16740/scratchpad/sent.jsonl', JSON.stringify({ to: m.to, subject: m.subject, html }) + '\n');
	return { data: { id: 'f' }, error: null };
} } } }));
const app = (await import(`${B}/index.ts`)).default;
Bun.serve({ port: 3101, fetch: app.fetch });
console.log('backend de teste em 3101');
