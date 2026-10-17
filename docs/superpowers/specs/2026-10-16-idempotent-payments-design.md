# Idempotent Payments Backend Design

## Scope

Build a TypeScript and Express learning backend using pnpm and Postgres. The API has three resources:

- `POST /accounts`
- `POST /payments`
- `GET /payments/:id`

Money is represented as integer paise throughout the API and database. Account creation defaults an omitted balance to zero. Idempotency keys are globally unique for this learning project.

## Persistence

Use the existing Docker Compose Postgres service and add a SQL migration under `db/migrations`. The migration creates the `accounts` and `payments` tables with UUID identifiers, non-negative account balances, positive payment amounts, foreign keys, a globally unique UUID idempotency key, request hash, response JSON, status, and creation timestamp.

The application uses `pg` with a connection pool and parameterized SQL. A small migration command applies SQL files to the configured database using `DATABASE_URL`.

## API contracts

`POST /accounts` accepts `{ "balancePaise": number }`. The field is optional and defaults to `0`; values must be non-negative integers. The response contains the account identifier and balance in paise.

`POST /payments` requires an `Idempotency-Key` header containing a UUID. The body is `{ "fromAccountId": string, "toAccountId": string, "amountPaise": number, "currency": string }`. The request hash is calculated from the canonical request body. A first request debits the source account, credits the destination account, and stores the response in one transaction.

When a key is retried with the same request body, the stored response is returned without applying another transfer. When the same key is used with a different request, the API returns `409 Conflict`. Missing accounts, insufficient funds, malformed UUIDs, invalid amounts, and missing idempotency keys return suitable `4xx` responses.

`GET /payments/:id` returns a stored payment by UUID or a not-found response.

## Transaction behavior

Payment creation locks the two account rows in deterministic UUID order, then checks the idempotency key and request hash. The debit, credit, and payment insert occur in the same transaction. This prevents duplicate transfers during retries and concurrent requests.

## Validation

The implementation will be checked with the TypeScript build and focused API/database checks where the local Postgres service is available. The README will document environment setup, migration, startup, and example requests.