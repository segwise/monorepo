# Usuários da corretora (`/configurations/users`)

Tela da equipe da corretora no portal `customer`: ver, cadastrar (por convite), alterar
perfil e suspender/reativar. Produtores e parceiros ficam em **Produtores**, não aqui.

## Perfis e hierarquia

Definidos uma vez em `packages/core/src/utils/user-roles.ts` (o backend aplica, a tela só oferece o
que o backend aceitaria):

| Perfil | Nível | Acessa a tela | Cadastra/altera |
|---|---|---|---|
| Dono (`owner`) | 4 | sim | admin, gerente, corretor, financeiro, contador |
| Administrador (`admin`) | 3 | sim | gerente, corretor, financeiro, contador |
| Gerente (`manager`) | 2 | sim | corretor, financeiro, contador |
| Corretor (`broker`), Financeiro (`finance`), Contador (`counter`) | 1 | não | ninguém |

Regras: só se atribui perfil **abaixo** do próprio; só se altera/suspende quem está
**abaixo**; ninguém altera a si mesmo; dono não se cadastra nem se altera (um por corretora).
Esses papéis hoje controlam só esta área: o resto do sistema ainda não restringe por perfil.

## Fluxo

1. `POST /services/users` cria o usuário (se o e-mail é novo), um `Invitation` com o perfil
   (+ código `referral` interno) e envia o e-mail (`InvitePartnerEmail` com saudação e perfil).
2. O link (`/accept-invitation?token=`) redireciona para o portal da corretora
   (`buildCustomerPortalUrl`: `CUSTOMER_PORTAL_URL` ou `APPLICATION_URL`); a pessoa define a
   senha e entra. O aceite é o mesmo `POST /accept-invitation` dos produtores.
3. Convite pendente aparece na lista (reenviar renova 30 dias; excluir cancela).

## Cadastro: CPF e perfil

- **CPF** é opcional ao cadastrar (a equipe atual foi criada sem) e **obrigatório ao editar**.
  CPF é único entre usuários: se já é de outra pessoa o cadastro/edição é recusado. Um CPF
  digitado só é gravado na conta do próprio cadastro (nunca em conta achada só pelo e-mail
  que já tenha outro CPF).
- **Perfil** é escolhido numa grade de cards com checkbox e descrição (`UserRoleGrid`);
  escolha única e obrigatória, e só aparecem os perfis que o usuário logado pode atribuir.
- O próprio usuário **nunca aparece** na lista (o backend filtra pelo id da sessão).

## Exclusão lógica e restauração

`Member.status = deleted` (migration `..._member_status_deleted`): nada é apagado, o
vínculo e tudo ligado ao usuário permanecem. O excluído perde o acesso como o suspenso,
some da lista padrão e aparece no filtro **Excluídos**. **Cadastrar o mesmo e-mail de novo
restaura o mesmo vínculo** (mesmo id, dados e histórico), com o perfil escolhido agora e a
senha que a pessoa já tinha, sem novo convite. Só restaura quem poderia gerenciar o perfil
que ele tinha (gerente não restaura um admin excluído). Excluído não é editado nem suspenso.

## Suspensão e exclusão (vale para todos os perfis, inclusive produtor)

`Member.status = suspended` ou `deleted` bloqueia o login (`databaseHooks.session.create.before`) e faz
`sessionMiddleware` ignorar a sessão já aberta (a requisição segue como deslogada → 401), sem
esperar a sessão expirar. O status vem de `customSession` (sem consulta extra por requisição).

## API (`/services/users`, todas exigem sessão e perfil com acesso, senão 403)

`GET /` lista membros (sem o próprio usuário, com excluídos) + convites pendentes (com
`canManage`, `assignableRoles`) · `POST /` cadastra ou restaura excluído · `PATCH /:memberId` nome/celular/perfil · `PATCH /:memberId/status` · `DELETE /:memberId` (exclusão lógica) ·
`POST /invitations/:id/resend` · `DELETE /invitations/:id`.

## Fora do escopo / pontos em aberto

- Não há exclusão física de usuário: só suspender ou excluir logicamente.
- A lista não tem paginação (equipe pequena); filtros e busca são no navegador.
- Perfil não restringe ainda o menu nem as demais telas/rotas.
- Troca de dono e o menu "Usuários" do portal `admin` (Segwise interno) não foram feitos.
