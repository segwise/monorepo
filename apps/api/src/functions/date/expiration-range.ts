// Intervalo de dias para colunas `@db.Date` (ex.: `Safe.expiration`).
//
// Por que não `lt: endOfDay(fim)`: o Prisma envia o valor como DATA quando a
// coluna é `date`, então `23:59:59.999` vira o próprio dia e `lt` exclui o
// último dia do intervalo (propostas que vencem no dia 31 sumiam do filtro de
// "mês"). Para coluna de data o fim é inclusivo: `lte` o dia final.
//
// O dia vem sempre da data UTC do valor recebido (o front manda o dia
// escolhido) e não do fuso do servidor, para o resultado não mudar conforme a
// máquina onde o backend roda.
//
// Vai como string ISO (`...T00:00:00.000Z`) e não como `Date`: o driver do
// Postgres serializa `Date` no fuso da máquina e o dia mudava conforme o TZ
// do servidor.
function utcDay(date: Date) {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	).toISOString();
}

function expirationRange(range: { start: Date; end: Date }) {
	return { gte: utcDay(range.start), lte: utcDay(range.end) };
}

export { expirationRange, utcDay };
