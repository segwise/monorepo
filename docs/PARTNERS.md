# Cadastro de parceiros (painel) — acesso imediato, senha criada pela corretora

Menu **Produtores → ▾ → Parceiro** (portal `customer`, `DialogProducerPartnerRegister`).
O cadastro **não pede CPF/CNPJ** e **não envia e-mail**: o acesso nasce liberado.
Produtor interno (`/producers/internal`) e o cadastro público por link
(`public-register.ts`) **não mudaram**: seguem pedindo CPF/CNPJ e usando convite por
e-mail (o parceiro define a própria senha na tela de aceite).

## Fluxo

1. O campo **Senha de acesso** nasce vazio e **acompanha o celular** (só dígitos) até
   a primeira edição manual (digitar nele ou usar **Gerar**); a partir daí mudar o
   celular não altera mais a senha. Reabrir o dialog volta a sincronizar. **Gerar**
   cria uma senha forte de 14 caracteres (`functions/auth/generate-password.ts`,
   `crypto.getRandomValues`, sem `* _ ~` para não quebrar o negrito do WhatsApp). A
   senha fica **só no estado do formulário** (campo `password`).
2. `POST /producers` (`SchemaProducerRegister` no core: sem `cpfOrCnpj`; `password` de
   8 a 128 caracteres — `SchemaPasswordConfirm`, não a senha forte, porque o celular
   só tem dígitos). O backend cria o usuário com a senha (hash argon2id feito pelo
   better-auth), **marca o e-mail como confirmado por baixo dos panos** e cria o
   `Member` (produtor) já ativo, com os dados do cadastro. Sem convite, sem e-mail.
3. A resposta traz só `{ message, accessUrl, passwordApplied }` — **nunca a senha**.
4. O dialog troca o conteúdo: login (e-mail), senha (ocultar/copiar), link de acesso
   e **Copiar para WhatsApp** (texto com `*negrito*` e quebras de linha). Clique fora
   e Esc não fecham; **Concluir** descarta tudo (senha trocada no estado, cache da
   mutation limpo). O parceiro já entra no portal do parceiro (`accessUrl`).

## Regras no backend (`routers/services/producers/register.ts`)

- Sem documento, o usuário é identificado só pelo e-mail
  (`functions/producers/find-or-create-producer-user.ts`, `cpfOrCnpj` opcional).
- A senha informada **só é aplicada** (e o e-mail só é confirmado) para conta nova ou
  conta **não confirmada e sem vínculo** (cadastro antigo que ninguém usou). Isso evita
  que alguém registre o e-mail de terceiro sem confirmar e ganhe acesso a uma corretora.
- Usuário que já existe e **já confirmou** mantém a senha dele (`passwordApplied =
  false`; o dialog avisa e o WhatsApp diz "a mesma que você já usa"); só ganha o vínculo.
- Conta existente **não confirmada com vínculo em outra corretora**: recusado (não dá
  para definir a senha sem tomar a conta).
- E-mail de equipe da corretora e parceiro já vinculado: recusados.
- Convite pendente antigo do mesmo e-mail é removido (senão seria um 2º caminho de
  aceite e repetiria o código de indicação).
- Código de indicação repetido: mensagem "já está em uso" e nada fica criado.

## Convites "só confirmar" (legado)

`Invitation.confirmOnly = true` e `functions/invitations/confirm-producer-invitation.ts`
(link do e-mail confirma e manda ao login, `?invitation=confirmed|used|expired|error`)
foram o fluxo anterior deste cadastro e continuam funcionando para convites que ficaram
pendentes. Cadastros novos de parceiro não geram mais convite.

## Segurança da senha

- Padrão = celular é uma senha fraca por escolha de negócio (número previsível): o
  parceiro deve trocá-la por "Esqueci minha senha"/perfil. Para senha forte use
  **Gerar**.
- O servidor só grava o **hash**; a senha não é devolvida, não vai por e-mail, não é
  logada nem guardada em storage/URL no navegador.
- Se o admin perder a senha antes de enviá-la, o parceiro usa "Esqueci minha senha".

## Troca de senha pelo próprio parceiro

No portal do parceiro (`app/producer/(dashboard)/dashboard/page.tsx`) o **avatar** do
cabeçalho abre um menu com **Alterar senha** e **Sair** (liberou o espaço dos botões
de ícone, que apertavam o nome no celular). **Alterar senha** abre
`containers/dialogs/auth/change-password.tsx`:

- senha atual + nova + confirmação, cada uma com mostrar/ocultar; checklist de
  requisitos (`password-must-contain.tsx`, também usado na redefinição de senha) que
  fica verde conforme atendido; botão só habilita com tudo válido;
- a nova segue a regra forte (`SchemaPassword`) e deve ser diferente da atual;
- opção **Sair dos outros dispositivos** (ligada por padrão → `revokeOtherSessions`):
  a sessão atual continua logada, as demais são encerradas;
- usa o endpoint do better-auth `POST /auth/change-password`
  (`libraries/hooks/auth/use-change-password.ts`); senha atual errada vem como `401`
  `INVALID_EMAIL_OR_PASSWORD` e aparece no próprio campo;
- o menu é controlado (`menuOpen`/`passwordOpen`) e o dialog fica **fora** do menu: o
  menu fecha ao escolher o item e não reaparece ao fechar o dialog (com o dialog dentro
  do `DropdownMenuContent` e `preventDefault`, o menu ficava aberto por baixo).

Quem entrou com o celular como senha (padrão do cadastro) resolve aqui. Os portais de
equipe (`backoffice`/`customer`) ainda não têm essa opção no menu do perfil (é um
componente de servidor); o dialog já aceita `open`/`onOpenChange` para ser plugado lá.
