# Deploy na VPS

Este projeto usa **MySQL + Prisma** para persistência (sem dados mockados) e
autenticação real por login/senha (JWT). Local de desenvolvimento e VPS seguem
os mesmos passos abaixo — só o conteúdo do `.env` muda.

## 1. Pré-requisitos na VPS

- Node.js **20 LTS ou 22 LTS** (o projeto não funciona em Node 18 ou anterior por causa do Prisma/Vite/Tailwind).
- MySQL Server 8.x rodando e acessível.
- Criar o banco de dados (uma vez):

```sql
CREATE DATABASE iptv_p2p_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha com os valores de produção:

```
DATABASE_URL="mysql://usuario:senha@localhost:3306/iptv_p2p_db"
JWT_SECRET="gere-um-valor-aleatorio-longo-e-diferente-do-dev"
PORT=3000
```

- Se a senha do MySQL tiver caracteres especiais (`@`, `#`, etc.), faça o percent-encode na URL (`@` → `%40`).
- `JWT_SECRET` deve ser único por ambiente — nunca reutilize o valor de desenvolvimento em produção.

## 3. Instalar dependências e preparar o banco

```bash
npm install
npx prisma migrate deploy   # cria/atualiza as tabelas a partir de prisma/migrations
npm run db:seed             # só na primeira vez: cria o usuário de acesso (renatomatos) e os dados padrão
```

`npm run db:seed` é **idempotente** — pode rodar de novo sem duplicar dados (usa upsert), mas normalmente só é necessário uma vez, na primeira implantação.

## 4. Build e start

```bash
npm run build
npm start
```

O servidor Express (`server.ts`) serve o front-end buildado e a API na mesma porta (`PORT`, padrão 3000). Recomenda-se colocar um processo supervisor (pm2, systemd) na frente para reiniciar automaticamente em caso de queda, e um proxy reverso (nginx/Caddy) para TLS.

## 5. Acesso ao sistema

O único usuário é criado pelo seed (`prisma/seed.ts`):

- **Usuário:** `renatomatos`
- **Senha:** a definida em `prisma/seed.ts` no momento do seed

Não existe tela de cadastro — para trocar a senha, edite `prisma/seed.ts` (ou rode um script pontual) e execute `npm run db:seed` novamente.

## Atualizações futuras (deploy de uma nova versão)

```bash
git pull
npm install
npx prisma migrate deploy   # aplica novas migrations, se houver
npm run build
# reiniciar o processo (pm2 restart / systemctl restart)
```
