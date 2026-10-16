# Idempotency Impl (learning project)

Boilerplate: TypeScript + Express + pnpm + Postgres (docker).

## Run

```sh
cp .env.example .env
docker compose up -d
pnpm install
pnpm dev
```

Health: `GET /health -> { ok: true }`
