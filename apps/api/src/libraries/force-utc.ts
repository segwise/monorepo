// O driver do Postgres serializa `Date` no fuso do processo. Em colunas
// `@db.Date` (ex.: `Safe.expiration`) isso deslocava o dia do filtro conforme o
// TZ da máquina (em dev no Brasil o resultado diferia da produção, que roda em
// UTC). Fixar UTC no início do processo deixa dev e produção idênticos; os
// fusos dos usuários continuam vindo de `X-timezone` (ctx.timezone).
process.env.TZ = 'UTC';
