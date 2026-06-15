# Contributing

First off, thanks for taking the time to contribute!

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the existing issues to see if the problem has already been reported. When creating a bug report, include as many details as possible:

- **Steps to reproduce** — be precise
- **Expected behavior** — what you expected to happen
- **Actual behavior** — what actually happened
- **Screenshots** — if applicable
- **Environment** — OS, Node version, Docker version, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating one:

- **Use a clear title** — descriptive and specific
- **Describe the problem** — what would this feature solve?
- **Describe the solution** — what would you like to see?
- **Describe alternatives** — what else have you considered?

### Pull Requests

1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies** — `npm install` in both `backend/` and `frontend/`
3. **Run tests** — ensure all tests pass: `npm test`
4. **Lint your code** — `npm run lint`
5. **Write tests** for new features
6. **Update docs** — if you change behavior, update the relevant docs
7. **Keep PRs focused** — one feature/fix per PR

## Development Workflow

### Setup

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed

# Frontend
cd frontend
cp .env.example .env.local
npm install
```

### Committing

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add order cancellation
fix: correct stock calculation on payment failure
docs: update API endpoints
refactor: extract shipping logic to service
chore: update Prisma to 5.20
```

### Branch naming

```
feature/order-cancellation
fix/stock-calculation
docs/api-endpoints
chore/update-dependencies
```

## Project Structure

```
ecommerce-aws/
├── backend/                    # NestJS API
│   ├── prisma/                 # Schema, migrations, seed
│   ├── src/
│   │   ├── common/             # Shared code (guards, decorators, etc.)
│   │   ├── modules/            # Feature modules (one per domain)
│   │   └── prisma/             # Database service
│   └── test/                   # E2E tests
├── frontend/                   # Next.js app
│   └── src/
│       ├── app/                # Pages (App Router)
│       ├── components/         # React components
│       ├── lib/                # Utilities
│       └── types/              # TypeScript types
├── infra/terraform/            # AWS IaC
└── docs/                       # Supplementary documentation
```

## Code Style

- **TypeScript** — strict mode enabled, `noImplicitAny`, `strictNullChecks`
- **Backend** — NestJS conventions (controllers, services, modules, DTOs)
- **Frontend** — Next.js App Router, React Server Components where possible
- **Formatting** — Prettier with default config
- **Linting** — ESLint (NestJS on backend, `next/core-web-vitals` on frontend)

## Testing

- **Unit tests** — Jest with `ts-jest`, files named `*.spec.ts`
- **E2E tests** — Jest with Supertest, files named `*.e2e-spec.ts`
- **Coverage** — aim for 80%+ on new code

Run tests:

```bash
# Unit tests
npm test

# E2E tests (backend)
npm run test:e2e

# Coverage
npm run test:cov
```

## Questions?

Open a [GitHub Discussion](https://github.com/your-org/ecommerce-aws/discussions) for questions, ideas, or general discussion.
